import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  loginRateLimiter, 
  passwordChangeRateLimiter,
  logFailedLogin, 
  logSuccessfulLogin,
  isAccountLocked 
} from '../middleware/security.js';

const router = express.Router();

// Login con protezione anti brute-force
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!username || !password) {
      logFailedLogin(username || 'unknown', clientIp, 'Missing credentials');
      return res.status(400).json({ 
        error: { message: 'Username e password sono richiesti' } 
      });
    }

    // Controlla se l'account è bloccato (troppi tentativi falliti)
    if (isAccountLocked(username)) {
      logFailedLogin(username, clientIp, 'Account locked');
      return res.status(429).json({ 
        error: { message: 'Account temporaneamente bloccato per troppi tentativi falliti. Riprova tra 1 ora.' } 
      });
    }

    const user = User.findByUsername(username);

    if (!user) {
      logFailedLogin(username, clientIp, 'User not found');
      return res.status(401).json({ 
        error: { message: 'Credenziali non valide' } 
      });
    }

    const isValidPassword = User.verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      logFailedLogin(username, clientIp, 'Invalid password');
      return res.status(401).json({ 
        error: { message: 'Credenziali non valide' } 
      });
    }

    // Login riuscito - log e genera token
    logSuccessfulLogin(username, clientIp);

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Errore durante il login' } });
  }
});

// Verifica token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Logout (client-side gestito rimuovendo il token)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout effettuato con successo' });
});

// Cambia password con validazione forte
router.post('/change-password', authenticateToken, passwordChangeRateLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: { message: 'Password corrente e nuova password sono richieste' } 
      });
    }

    // Importa la validazione password forte
    const { validateStrongPassword } = await import('../middleware/security.js');
    const validation = validateStrongPassword(newPassword);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: { 
          message: 'La password non soddisfa i requisiti di sicurezza',
          details: validation.errors 
        } 
      });
    }

    const user = User.findByIdWithPassword(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: { message: 'Utente non trovato' } 
      });
    }
    
    const isValidPassword = User.verifyPassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      const clientIp = req.ip || req.connection.remoteAddress;
      logFailedLogin(user.username, clientIp, 'Invalid password on change');
      return res.status(401).json({ 
        error: { message: 'Password corrente non valida' } 
      });
    }

    User.updatePassword(req.user.id, newPassword);

    res.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: { message: 'Errore durante il cambio password' } });
  }
});

export default router;
