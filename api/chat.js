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

    // 1. Consultar los datos de la tabla 'clientes' en Supabase para obtener el contexto
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('*');

    if (clientesError) {
      console.error('Error al obtener clientes de Supabase:', clientesError);
    }

    // 2. Construir el contexto estructurado con la información de los clientes
    const clientesContext = clientesData 
      ? JSON.stringify(clientesData, null, 2) 
      : 'No hay datos de clientes disponibles.';

    // 3. Crear un prompt enriquecido que combine el contexto de la base de datos y la pregunta del usuario
    const systemPrompt = `
Eres un asistente virtual corporativo de la empresa. Tienes acceso a la siguiente base de datos de clientes en formato JSON:
${clientesContext}

Por favor, responde a la pregunta del usuario basándote exclusivamente en esta información de clientes cuando sea relevante. Si te preguntan por ubicaciones, recuentos o datos específicos, extráelos de este listado.
    `;

    const fullPrompt = `${systemPrompt}\n\nPregunta del usuario: ${message}`;

    // 4. Llamada a Gemini con el contexto inyectado
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: fullPrompt,
      config: {
        maxOutputTokens: 300,
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

    // 5. Guardar el registro en la tabla 'chat_logs'
    const { error: dbError } = await supabase.from('chat_logs').insert([
      {
        model_used: selectedModel,
        prompt: message, // Guardamos la pregunta original del usuario para mantener el log limpio
        reply: replyText,
        prompt_tokens: tokenData.promptTokens,
        response_tokens: tokenData.responseTokens,
        total_tokens: tokenData.totalTokens
      }
    ]);

    return res.status(200).json({
      success: true,
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
      error: 'Error interno al procesar la petición',
      details: error.message
    });
  }
});

export default app;