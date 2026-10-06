import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Falta el campo message en el body' });
    }

    const selectedModel = 'gemini-3.1-flash-lite';
    const apiVersion = 'v1.1';

    // 1. Consultar de forma concurrente todas las tablas de negocio en Supabase (excluyendo chat_logs)
    const [
      { data: almacenData },
      { data: clientesData },
      { data: comprasData },
      { data: estadoIntervencionesData },
      { data: intervencionesData },
      { data: productosData },
      { data: proveedoresData },
      { data: serviciosData },
      { data: stockData },
      { data: ventasData }
    ] = await Promise.all([
      supabase.from('almacen').select('*'),
      supabase.from('clientes').select('*'),
      supabase.from('compras').select('*'),
      supabase.from('estadointervenciones').select('*'),
      supabase.from('intervenciones').select('*'),
      supabase.from('productos').select('*'),
      supabase.from('proveedores').select('*'),
      supabase.from('servicios').select('*'),
      supabase.from('stock').select('*'),
      supabase.from('ventas').select('*')
    ]);

    // 2. Consolidar todo el contexto corporativo estructurado por tablas
    const corporateContext = {
      almacen: almacenData || [],
      clientes: clientesData || [],
      compras: comprasData || [],
      estadoIntervenciones: estadoIntervencionesData || [],
      intervenciones: intervencionesData || [],
      productos: productosData || [],
      proveedores: proveedoresData || [],
      servicios: serviciosData || [],
      stock: stockData || [],
      ventas: ventasData || []
    };

    const contextString = JSON.stringify(corporateContext, null, 2);

    // 3. Crear el prompt del sistema corporativo con acceso global a todas las tablas
    const systemPrompt = `
Eres un asistente virtual corporativo integral de la empresa. Tienes acceso completo a la base de datos de la compañía en formato JSON, la cual incluye múltiples tablas interrelacionadas (almacén, clientes, compras, estado de intervenciones, intervenciones, productos, proveedores, servicios, stock y ventas):
${contextString}

Instrucciones:
- Responde a la pregunta del usuario basándote exclusivamente en la información corporativa anterior.
- Puedes cruzar o relacionar datos entre tablas si la pregunta lo requiere (por ejemplo, relacionar clientes con ventas o productos con stock/almacén).
- Si te preguntan sobre temas ajenos a la empresa (clima, opiniones personales, etc.), recházalo educadamente indicando que solo atiendes consultas corporativas autorizadas.
    `;

    const fullPrompt = `${systemPrompt}\n\nPregunta del usuario: ${message}`;

    // 4. Llamada a Gemini con el contexto global inyectado
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: fullPrompt,
      config: {
        maxOutputTokens: 500,
        temperature: 0.2,
      }
    });

    const usage = response.usageMetadata || {};
    const replyText = response.text;

    const tokenData = {
      promptTokens: usage.promptTokenCount || 0,
      responseTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0
    };

    // 5. Guardar el registro de la auditoría en la tabla 'chat_logs'
    const { error: dbError } = await supabase.from('chat_logs').insert([
      {
        model_used: selectedModel,
        prompt: message,
        reply: replyText,
        prompt_tokens: tokenData.promptTokens,
        response_tokens: tokenData.responseTokens,
        total_tokens: tokenData.totalTokens
      }
    ]);

    return res.status(200).json({
      success: true,
      apiVersion: apiVersion,
      modelUsed: selectedModel,
      reply: replyText,
      tokens: tokenData,
      databaseStatus: dbError ? { saved: false, error: dbError.message } : { saved: true },
      receivedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al procesar la petición:', error);
    return res.status(500).json({
      success: false,
      apiVersion: 'v1.1',
      error: 'Error interno al procesar la petición',
      details: error.message
    });
  }
});

export default app;