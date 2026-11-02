import rateLimit from 'express-rate-limit';

/**
 * Deep sanitization function to prevent NoSQL Injection attacks.
 * Removes any keys that start with '$' or contain '.' in objects, arrays, and subdocuments.
 */
export const sanitizeMongoData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeMongoData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(payload)) {
    // Prohibit keys starting with $ (MongoDB query operators) or containing dots
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (value && typeof value === 'object') {
      const cleanSub = sanitizeMongoData(value);
      // If object was stripped down to empty (e.g. {$gt: ''} or {$ne: 'null'}), do not leave an empty object
      if (cleanSub && typeof cleanSub === 'object' && !Array.isArray(cleanSub) && Object.keys(cleanSub).length === 0) {
        continue;
      }
      sanitized[key] = cleanSub;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Express Middleware: NoSQL Injection Sanitization
 * Sanitizes req.body, req.query, and req.params
 */
export const sanitizeMongoInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeMongoData(req.body);
  }
  if (req.query) {
    req.query = sanitizeMongoData(req.query);
  }
  if (req.params) {
    req.params = sanitizeMongoData(req.params);
  }
  next();
};

/**
 * Basic XSS sanitization helper.
 * Strips dangerous HTML tags and script elements from user string inputs.
 */
const sanitizeStringXSS = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:[^"']*/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '');
};

const sanitizeDeepXSS = (payload) => {
  if (!payload) return payload;

  if (typeof payload === 'string') {
    return sanitizeStringXSS(payload);
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeDeepXSS(item));
  }

  if (typeof payload === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(payload)) {
      cleaned[key] = sanitizeDeepXSS(value);
    }
    return cleaned;
  }

  return payload;
};

/**
 * Express Middleware: XSS Input Sanitization
 */
export const sanitizeXSS = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeepXSS(req.body);
  }
  next();
};

/**
 * Express Middleware: HTTP Method Filter
 * Blocks unsupported or dangerous HTTP methods like TRACE, TRACK, CONNECT.
 */
export const methodFilter = (req, res, next) => {
  const disallowedMethods = ['TRACE', 'TRACK', 'CONNECT'];
  if (disallowedMethods.includes(req.method.toUpperCase())) {
    return res.status(405).json({
      success: false,
      message: `HTTP Method ${req.method} is not allowed on this server.`,
    });
  }
  next();
};

/**
 * Rate Limiter for Authentication endpoints (Login & Registration)
 * Protects against brute-force attacks and credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate Limiter for Password Reset endpoints
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate Limiter for File Uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload rate limit exceeded. Please wait before uploading more documents.',
  },
});
