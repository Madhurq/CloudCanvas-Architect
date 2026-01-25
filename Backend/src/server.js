import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { errorHandler } from './middleware/middleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import architectureRoutes from './routes/architectureRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import deploymentRoutes from './routes/deploymentRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/architectures', architectureRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
