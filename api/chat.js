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

    // Llamada optimizada para consumir los mínimos tokens posibles
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        maxOutputTokens: 150, // Limita la respuesta a un texto corto y directo
        temperature: 0.3,     // Reduce la aleatoriedad para respuestas más precisas y directas
      }
    });

    return res.status(200).json({
      success: true,
      reply: response.text,
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