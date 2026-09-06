import express from 'express';
import { createChatSession } from '../services/gemini.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty' });
    }

    // Validate format
    for (const msg of messages) {
      if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Each message must have a role and content string' });
      }
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }

    const historyMessages = messages.slice(0, -1);
    const history = historyMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = await createChatSession(history);
    const result = await chat.sendMessage({ message: lastMessage.content });

    res.json({ response: result.text });
  } catch (error) {
    console.error('Chat error:', error.message);
    if (error.message && error.message.includes('Failed to retrieve secrets required for AI functionality')) {
      return res.status(503).json({ error: 'Service Unavailable' });
    }
    res.status(500).json({ error: 'An error occurred processing the chat request' });
  }
});

export default router;
