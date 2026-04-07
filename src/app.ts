import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import posRoutes from './modules/pos/pos.routes';
import customersRoutes from './modules/customers/customers.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// ─── Middlewares ──────────────────────────────
// Parse incoming JSON requests
app.use(express.json());

// Parse URL encoded data
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use(helmet());

// CORS - Allow frontend to talk to backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ── Routes ────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/pos', posRoutes);

// ─── Health Check Route ───────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'ProSystem API is running!',
    timestamp: new Date().toISOString()
  });
});

export default app;