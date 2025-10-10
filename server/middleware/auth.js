import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: { message: 'Token di autenticazione mancante' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: { message: 'Utente non trovato' } });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token scaduto' } });
    }
    return res.status(403).json({ error: { message: 'Token non valido' } });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Accesso negato: privilegi admin richiesti' } });
  }
  next();
}
