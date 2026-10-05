import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de prueba temporal
app.post('/api/chat', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Falta el campo message en el body' });
  }

  return res.status(200).json({
    success: true,
    reply: `¡Hola desde Vercel! Mensaje recibido correctamente: "${message}". Próximamente aquí responderá la IA con datos de Supabase.`,
    receivedAt: new Date().toISOString()
  });
});

export default app;