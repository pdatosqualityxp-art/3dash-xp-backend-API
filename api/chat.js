import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Falta el campo message en el body' });
    }

    // Definimos el modelo seleccionado para mayor claridad
    const selectedModel = 'gemini-3.1-flash-lite';

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: message,
      config: {
        maxOutputTokens: 150,
        temperature: 0.3,
      }
    });

    // Extraer las métricas de uso de tokens devueltas por Gemini
    const usage = response.usageMetadata || {};

    return res.status(200).json({
      success: true,
      modelUsed: selectedModel,
      reply: response.text,
      tokens: {
        promptTokens: usage.promptTokenCount || 0,
        responseTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0
      },
      receivedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al conectar con Gemini:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al procesar la petición con la IA',
      details: error.message
    });
  }
});

export default app;