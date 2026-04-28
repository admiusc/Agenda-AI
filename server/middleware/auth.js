const bcrypt = require('bcryptjs');
const { getDb } = require('../database/schema');

function getSetting(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

// Middleware simple de autenticación por header
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== req.app.locals.adminToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// Verificar contraseña y devolver token de sesión
function verifyPassword(password) {
  const hash = getSetting('admin_password');
  return bcrypt.compareSync(password, hash);
}

// Hash de nueva contraseña
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

module.exports = { requireAdmin, verifyPassword, hashPassword };
