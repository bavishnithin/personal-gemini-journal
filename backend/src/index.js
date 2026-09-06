import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';

import chatRouter from './routes/chat.js';
import entriesRouter from './routes/entries.js';
import trendsRouter from './routes/trends.js';
import promptsRouter from './routes/prompts.js';
import exportRouter from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json({ limit: '1mb' }));

// Health check (No Auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Apply auth middleware to all /api routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/entries', entriesRouter); // Includes /api/entries/:id/analyze
app.use('/api/trends', trendsRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/export', exportRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
