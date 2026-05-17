// ═══════════════════════════════════════════════════════
//  EcoAlert — Auth Middleware
//  Verifies the JWT token issued on admin login
// ═══════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin token required' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_change_this'
    );

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    req.admin = decoded;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { verifyAdminToken };
