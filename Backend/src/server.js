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
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ].filter(Boolean);
    
    // Check if origin matches allowed patterns
    const isLocalhost = origin.match(/^http:\/\/localhost:\d+$/);
    
    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
