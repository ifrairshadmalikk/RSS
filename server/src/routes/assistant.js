import express from 'express';
import { chatWithAssistant } from '../services/aiService.js';

const router = express.Router();

router.post('/chat', async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const reply = await chatWithAssistant(message, history);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

export default router;
