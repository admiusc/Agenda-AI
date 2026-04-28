const express = require('express');
const router = express.Router();
const { getDb } = require('../database/schema');
const { requireAdmin, verifyPassword, hashPassword } = require('../middleware/auth');
const { getAvailableSlots } = require('../services/slots');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  // Generar token de sesión simple (en producción usar JWT)
  const token = Buffer.from(`${password}:${Date.now()}`).toString('base64');
  req.app.locals.adminToken = token;
  res.json({ success: true, token });
});

// POST /api/admin/logout
router.post('/logout', requireAdmin, (req, res) => {
  req.app.locals.adminToken = null;
  res.json({ success: true });
});

// GET /api/admin/appointments — todas las citas
router.get('/appointments', requireAdmin, (req, res) => {
  const db = getDb();
  const { status, date_from, date_to, search } = req.query;

  let query = `
    SELECT a.*, s.name as service_name, s.color as service_color, s.duration as service_duration
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (date_from) {
    query += ' AND a.date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND a.date <= ?';
    params.push(date_to);
  }
  if (search) {
    query += ' AND (a.client_name LIKE ? OR a.client_email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY a.date ASC, a.time ASC';

  const appointments = db.prepare(query).all(...params);
  res.json(appointments);
});

// PATCH /api/admin/appointments/:id — actualizar estado
router.patch('/appointments/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const { status, notes, admin_notes } = req.body;
  const notesValue = notes !== undefined ? notes : admin_notes;
  const { id } = req.params;

  const allowed = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (notesValue !== undefined) { updates.push('admin_notes = ?'); params.push(notesValue); }
  updates.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare(`
    SELECT a.*, s.name as service_name, s.color as service_color
    FROM appointments a JOIN services s ON a.service_id = s.id
    WHERE a.id = ?
  `).get(id);

  res.json(updated);
});

// DELETE /api/admin/appointments/:id
router.delete('/appointments/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/admin/analytics — estadísticas
router.get('/analytics', requireAdmin, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const total     = db.prepare(`SELECT COUNT(*) as c FROM appointments`).get().c;
  const pending   = db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE status = 'pending'`).get().c;
  const confirmed = db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE status = 'confirmed'`).get().c;
  const cancelled = db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE status = 'cancelled'`).get().c;
  const completed = db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE status = 'completed'`).get().c;

  const topServices = db.prepare(`
    SELECT s.name as service_name, s.color, COUNT(a.id) as count
    FROM appointments a JOIN services s ON a.service_id = s.id
    WHERE a.status != 'cancelled'
    GROUP BY s.id ORDER BY count DESC LIMIT 5
  `).all();

  const topTimes = db.prepare(`
    SELECT time, COUNT(*) as count
    FROM appointments WHERE status != 'cancelled'
    GROUP BY time ORDER BY count DESC LIMIT 10
  `).all();

  const dailyStats = db.prepare(`
    SELECT date, COUNT(*) as count
    FROM appointments WHERE date >= date('now', '-30 days') AND status != 'cancelled'
    GROUP BY date ORDER BY date ASC
  `).all();

  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  res.json({
    totals: { total, pending, confirmed, cancelled, completed },
    cancellationRate,
    topServices,
    topTimes,
    dailyStats,
  });
});

// GET/PUT /api/admin/settings
router.get('/settings', requireAdmin, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    if (row.key !== 'admin_password') settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put('/settings', requireAdmin, (req, res) => {
  const db = getDb();
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const forbidden = ['admin_password'];

  db.exec('BEGIN');
  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (!forbidden.includes(key)) update.run(String(value), key);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  res.json({ success: true });
});

router.put('/settings/password', requireAdmin, (req, res) => {
  const db = getDb();
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const hash = hashPassword(password);
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(hash, 'admin_password');
  res.json({ success: true });
});

// GET/POST/DELETE /api/admin/services
router.get('/services', requireAdmin, (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM services ORDER BY id').all());
});

router.post('/services', requireAdmin, (req, res) => {
  const db = getDb();
  const { name, description, duration, price, color } = req.body;
  if (!name || !duration) return res.status(400).json({ error: 'Nombre y duración son requeridos' });

  const result = db.prepare(`
    INSERT INTO services (name, description, duration, price, color) VALUES (?, ?, ?, ?, ?)
  `).run(name, description || '', duration, price || 0, color || '#3B82F6');

  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/services/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const { name, description, duration, price, color, active } = req.body;
  db.prepare(`
    UPDATE services SET name=?, description=?, duration=?, price=?, color=?, active=? WHERE id=?
  `).run(name, description, duration, price, color, active ? 1 : 0, req.params.id);

  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id));
});

router.delete('/services/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/admin/blocked-slots & POST & DELETE
router.get('/blocked-slots', requireAdmin, (req, res) => {
  const db = getDb();
  const { date } = req.query;
  const rows = date
    ? db.prepare('SELECT * FROM blocked_slots WHERE date = ?').all(date)
    : db.prepare('SELECT * FROM blocked_slots ORDER BY date, start_time').all();
  res.json(rows);
});

router.post('/blocked-slots', requireAdmin, (req, res) => {
  const db = getDb();
  const { date, start_time, end_time, reason } = req.body;
  if (!date || !start_time) return res.status(400).json({ error: 'Fecha y hora de inicio requeridas' });
  const result = db.prepare('INSERT INTO blocked_slots (date, start_time, end_time, reason) VALUES (?, ?, ?, ?)')
    .run(date, start_time, end_time || null, reason || '');
  res.json({ id: result.lastInsertRowid, date, start_time, end_time, reason });
});

router.delete('/blocked-slots/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM blocked_slots WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
