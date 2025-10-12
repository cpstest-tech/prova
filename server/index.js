import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import buildsRoutes from './routes/builds.js';
import adminRoutes from './routes/admin.js';
import seoRoutes from './routes/seo.js';

// Database initialization
import { initializeDatabase } from './models/schema.js';

// Price scheduler
import { startPriceScheduler } from './utils/priceScheduler.js';

// Security middleware
import { sanitizeBody, preventParameterPollution } from './middleware/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Compression middleware per ridurre dimensioni richieste
app.use(compression({
  level: 6,
  threshold: 1024, // Comprimi solo file > 1KB
  filter: (req, res) => {
    // Non comprimere immagini già compresse
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Timeout configuration - aumentato per AWS EC2
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minuti timeout per richieste (era 2 minuti)
  res.setTimeout(300000); // 5 minuti timeout per risposte (era 2 minuti)
  next();
});

// Security middleware avanzati

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.amazon.com", "https://www.amazon.it", "https://www.amazon.com", "http:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false, // Disabilita HSTS in development
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Rate limiting generale (più permissivo)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 200, // max 200 richieste per IP
  message: { error: { message: 'Troppe richieste da questo IP, riprova più tardi.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);

// CORS configurato in modo sicuro
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://build-pc.it', 'https://www.build-pc.it']
    : ['http://localhost:5173', 'http://build-pc.it', 'https://build-pc.it', 'http://www.build-pc.it', 'https://www.build-pc.it'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 ore
}));

// Body parser con limite dimensioni aumentato per upload AWS EC2
app.use(express.json({ 
  limit: '50mb',
  parameterLimit: 10000, // Aumenta limite parametri
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 10000 // Aumenta limite parametri
}));

// Middleware per logging upload requests (debug AWS)
app.use('/api/admin/upload', (req, res, next) => {
  console.log('📤 Upload request:', {
    method: req.method,
    headers: {
      'content-type': req.get('content-type'),
      'content-length': req.get('content-length'),
      'user-agent': req.get('user-agent')
    },
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Sanitizzazione input per prevenire XSS
app.use(sanitizeBody);

// Prevenzione parameter pollution
app.use(preventParameterPollution);

// Trust proxy per ottenere IP reale (importante per rate limiting)
app.set('trust proxy', 1);

// Disabilita reindirizzamento HTTPS in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Rimuovi header che forzano HTTPS
    res.removeHeader('Strict-Transport-Security');
    res.removeHeader('Upgrade-Insecure-Requests');
    next();
  });
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve React build in produzione
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/builds', buildsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint semplice
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server funziona correttamente!', 
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    protocol: req.protocol,
    secure: req.secure,
    environment: process.env.NODE_ENV || 'development',
    headers: {
      'x-forwarded-for': req.get('x-forwarded-for'),
      'x-real-ip': req.get('x-real-ip'),
      'host': req.get('host'),
      'x-forwarded-proto': req.get('x-forwarded-proto')
    }
  });
});

// SEO Routes (dopo le API routes)
app.use('/', seoRoutes);

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

// Catch all handler per React Router (solo in produzione)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // 404 handler per sviluppo
  app.use((req, res) => {
    res.status(404).json({ error: { message: 'Endpoint non trovato' } });
  });
}

// Initialize database before starting server
initializeDatabase();

// Il sistema di controllo prezzi è ora gestito dal PriceScheduler nel server.listen

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server avviato su http://0.0.0.0:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Avvia il sistema di aggiornamento prezzi
  try {
    startPriceScheduler();
    console.log(`💰 Sistema aggiornamento prezzi avviato`);
  } catch (error) {
    console.error(`❌ Errore avvio sistema prezzi:`, error.message);
  }
});

// Configurazione timeout del server per AWS EC2
server.timeout = 300000; // 5 minuti (era 60s)
server.keepAliveTimeout = 310000; // 5 minuti + 10s (era 65s)
server.headersTimeout = 320000; // 5 minuti + 20s (era 66s)

// Error handling per il server
server.on('error', (err) => {
  console.error('❌ Errore del server:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} già in uso!`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Ricevuto SIGTERM, chiusura graceful...');
  server.close(() => {
    console.log('✅ Server chiuso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Ricevuto SIGINT, chiusura graceful...');
  server.close(() => {
    console.log('✅ Server chiuso');
    process.exit(0);
  });
});
