import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from '../../server/routes/auth.js';
import buildsRoutes from '../../server/routes/builds.js';
import adminRoutes from '../../server/routes/admin.js';
import seoRoutes from '../../server/routes/seo.js';

// Database initialization
import { initializeDatabase } from '../../server/models/schema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
import { sanitizeBody, preventParameterPollution } from '../../server/middleware/security.js';

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.amazon.com", "https://www.amazon.it", "https://www.amazon.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: { message: 'Troppe richieste da questo IP, riprova più tardi.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://tuo-sito.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeBody);
app.use(preventParameterPollution);

// Trust proxy
app.set('trust proxy', 1);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/builds', buildsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', seoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Errore interno del server',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Endpoint non trovato' } });
});

// Initialize database
initializeDatabase();

export const handler = app;
