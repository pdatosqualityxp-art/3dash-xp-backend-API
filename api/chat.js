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

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: message,
      config: {
        maxOutputTokens: 150,
        temperature: 0.3,
      }
    });

    const usage = response.usageMetadata || {};
    const replyText = response.text;

    const tokenData = {
      promptTokens: usage.promptTokenCount || 0,
      responseTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0
    };

    // Intentar guardar en Supabase y capturar el error si lo hay
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