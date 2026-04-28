const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/schema');
const { getAvailableSlots, getAvailableDays } = require('../services/slots');
const { sendConfirmationEmail } = require('../services/email');

function getSetting(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

// GET /api/services — lista de servicios activos
router.get('/services', (req, res) => {
  const db = getDb();
  const services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY id').all();
  res.json(services);
});

// GET /api/availability/:year/:month — días disponibles del mes
router.get('/availability/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const days = getAvailableDays(parseInt(year), parseInt(month));
  res.json(days);
});

// GET /api/slots/:date — horarios disponibles para una fecha
router.get('/slots/:date', (req, res) => {
  const slots = getAvailableSlots(req.params.date);
  res.json(slots);
});

// POST /api/appointments — crear nueva cita
router.post('/appointments', async (req, res) => {
  const db = getDb();
  const { service_id, client_name, client_email, client_phone, client_notes, date, time } = req.body;

  if (!service_id || !client_name || !client_email || !date || !time) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Verificar que el slot sigue disponible
  const slots = getAvailableSlots(date);
  const slot = slots.find(s => s.time === time);
  if (!slot) {
    return res.status(409).json({ error: 'Este horario ya no está disponible. Por favor elige otro.' });
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(service_id);
  if (!service) return res.status(400).json({ error: 'Servicio no válido' });

  const token = uuidv4();

  try {
    db.prepare(`
      INSERT INTO appointments (token, service_id, client_name, client_email, client_phone, client_notes, date, time, end_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(token, service_id, client_name.trim(), client_email.trim().toLowerCase(),
       client_phone || null, client_notes || null, date, time, slot.endTime);

    const appointment = db.prepare('SELECT * FROM appointments WHERE token = ?').get(token);

    // Enviar emails en background
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    sendConfirmationEmail(appointment, service, baseUrl).catch(console.error);

    res.json({
      success: true,
      token,
      appointment: {
        ...appointment,
        service_name: service.name,
        service_duration: service.duration,
        service_color: service.color,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
});

// GET /api/appointment/:token — detalles de una cita por token
router.get('/appointment/:token', (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT a.*, s.name as service_name, s.duration as service_duration, s.color as service_color
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.token = ?
  `).get(req.params.token);

  if (!row) return res.status(404).json({ error: 'Cita no encontrada' });
  res.json(row);
});

// POST /api/cancel/:token — cancelar cita
router.post('/cancel/:token', (req, res) => {
  const db = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE token = ?').get(req.params.token);

  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  if (appt.status === 'cancelled') return res.status(400).json({ error: 'La cita ya está cancelada' });

  db.prepare(`UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE token = ?`)
    .run(req.params.token);

  res.json({ success: true, message: 'Cita cancelada correctamente' });
});

// POST /api/reschedule/:token — reagendar cita
router.post('/reschedule/:token', (req, res) => {
  const db = getDb();
  const { date, time } = req.body;

  const appt = db.prepare('SELECT * FROM appointments WHERE token = ?').get(req.params.token);
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  if (appt.status === 'cancelled') return res.status(400).json({ error: 'No se puede reagendar una cita cancelada' });

  const slots = getAvailableSlots(date);
  const slot = slots.find(s => s.time === time);
  if (!slot) return res.status(409).json({ error: 'Horario no disponible' });

  db.prepare(`
    UPDATE appointments SET date = ?, time = ?, end_time = ?, status = 'confirmed', reminder_sent = 0, updated_at = datetime('now')
    WHERE token = ?
  `).run(date, time, slot.endTime, req.params.token);

  const updated = db.prepare('SELECT * FROM appointments WHERE token = ?').get(req.params.token);
  res.json({ success: true, appointment: updated });
});

// GET /api/public-settings — configuración pública (nombre del negocio, mensaje)
router.get('/public-settings', (req, res) => {
  const db = getDb();
  const keys = ['business_name', 'welcome_message', 'confirmation_message', 'timezone'];
  const result = {};
  for (const key of keys) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if (row) result[key] = row.value;
  }
  res.json(result);
});

module.exports = router;
