import rateLimit from 'express-rate-limit';
import db from '../config/database.js';

// Rate limiter aggressivo per il login - max 5 tentativi in 15 minuti
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // Max 5 tentativi
  message: { error: { message: 'Troppi tentativi di login. Riprova tra 15 minuti.' } },
  standardHeaders: true,
  legacyHeaders: false,
  // Chiave personalizzata per tracciare per IP + username
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const username = req.body?.username || 'unknown';
    return `${ip}-${username}`;
  },
  // Incrementa solo su tentativi falliti
  skipSuccessfulRequests: true,
});

// Rate limiter per cambio password - max 3 tentativi in 15 minuti
export const passwordChangeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: { message: 'Troppi tentativi di cambio password. Riprova tra 15 minuti.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Logging dei tentativi di login falliti
export function logFailedLogin(username, ip, reason) {
  try {
    const stmt = db.prepare(`
      INSERT INTO login_attempts (username, ip_address, success, reason, attempted_at)
      VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(username, ip, reason);
  } catch (error) {
    console.error('Error logging failed login:', error);
  }
}

// Logging dei login riusciti
export function logSuccessfulLogin(username, ip) {
  try {
    const stmt = db.prepare(`
      INSERT INTO login_attempts (username, ip_address, success, reason, attempted_at)
      VALUES (?, ?, 1, 'Login successful', CURRENT_TIMESTAMP)
    `);
    stmt.run(username, ip);
  } catch (error) {
    console.error('Error logging successful login:', error);
  }
}

// Controlla se un account è bloccato (più di 10 tentativi falliti in 1 ora)
export function isAccountLocked(username) {
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM login_attempts 
      WHERE username = ? 
        AND success = 0 
        AND attempted_at > datetime('now', '-1 hour')
    `);
    const result = stmt.get(username);
    return result.count >= 10;
  } catch (error) {
    console.error('Error checking account lock:', error);
    return false;
  }
}

// Sanitizzazione input per prevenire XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Rimuove tag HTML e script pericolosi
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validazione password forte
export function validateStrongPassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La password deve contenere almeno 8 caratteri');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Middleware per sanitizzare tutti gli input del body
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
}

// Middleware per prevenire parameter pollution
export function preventParameterPollution(req, res, next) {
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }
  next();
}

