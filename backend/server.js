import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import schemeRoutes from './routes/schemeRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import checklistRoutes from './routes/checklistRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import {
  methodFilter,
  sanitizeMongoInput,
  sanitizeXSS,
} from './middleware/securityMiddleware.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Load environment variables from .env file
dotenv.config();

// Verify JWT_SECRET configuration
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'sarkarisetu_fallback_secret')) {
  console.error('[Security Warning] JWT_SECRET is not configured or using fallback in production mode!');
}

// Initialize MongoDB connection
connectDB();

const app = express();

// Trust proxy for secure HTTPS headers behind reverse proxy / load balancer
app.set('trust proxy', 1);

// Security Middleware: Strict CORS Configuration (Placed first to ensure all responses & preflights have CORS headers)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.0.186:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://192.168.0.186:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow curl, mobile apps, direct navigation, and server-to-server calls
  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.some((o) => o.replace(/\/+$/, '') === cleanOrigin)) return true;
  // In development, permit any localhost, 127.0.0.1, or local LAN subnet (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (process.env.NODE_ENV !== 'production') {
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
    const isLocalLAN = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(cleanOrigin);
    return isLocalhost || isLocalLAN;
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS access denied for this origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Middleware: Helmet HTTP Security Headers & Content Security Policy (CSP)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || 'http://localhost:5173',
          'http://localhost:*',
          'http://127.0.0.1:*',
          'http://192.168.*:*',
          'http://10.*:*',
          'http://localhost:5000',
          'http://127.0.0.1:5000',
          'http://192.168.0.186:5000',
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: null, // Critical: prevent upgrading localhost HTTP to HTTPS
      },
    },
    // Only enable HSTS in production when running over HTTPS; in dev, disable so browser allows HTTP
    hsts:
      process.env.NODE_ENV === 'production' && process.env.ENABLE_HSTS === 'true'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    frameguard: { action: 'sameorigin' },
    noSniff: true,
  })
);

// In development, clear any stale HSTS policy cached for localhost by previous sessions
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=0');
    next();
  });
}

// Security Middleware: Restrict Disallowed HTTP Methods
app.use(methodFilter);

// Security Middleware: Global API Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'test' ? 10000 : 1000, // Request limit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// Request body size limits (1mb payload ceiling to prevent memory exhaustion DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security Middleware: NoSQL Injection Defense & XSS Input Sanitization
app.use(sanitizeMongoInput);
app.use(sanitizeXSS);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'SarkariSetu API',
    version: '4.0.0 (Production Ready & Secure)',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (Phases 1 to 7 and Security enhancements)
app.use('/api/schemes', schemeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware (Safe masking of internal errors)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SarkariSetu Server running in ${process.env.NODE_ENV || 'development'} mode (Production Secure)`);
  console.log(` Server URL: http://localhost:${PORT}`);
  console.log(` Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`====================================================`);
});
