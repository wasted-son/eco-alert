// ═══════════════════════════════════════════════════════
//  EcoAlert — Admin Routes
//  Admin login and authentication endpoints
// ═══════════════════════════════════════════════════════

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Fixed admin password (change in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_this';
const TOKEN_EXPIRY = '24h';

// ─────────────────────────────────────────────────────────
//  POST /api/admin/login
// ─────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const token = jwt.sign(
      { role: 'admin', iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({ token, success: true });
  } catch (err) {
    console.error('[Admin login error]', err.message);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
