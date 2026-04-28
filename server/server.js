require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { getDb } = require('./database/schema');
const { sendReminderEmail } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// En Railway, la URL pública viene en RAILWAY_PUBLIC_DOMAIN
const BASE_URL = process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${PORT}`);

app.use(cors({
  origin: IS_PROD ? BASE_URL : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());
app.locals.adminToken = null;

// Rutas API
app.use('/api', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// En producción, servir el frontend compilado
if (IS_PROD) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Cron: recordatorios 24h antes (corre cada hora)
cron.schedule('0 * * * *', async () => {
  const db = getDb();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const pending = db.prepare(`
    SELECT a.*, s.name as service_name, s.duration as service_duration, s.color as service_color
    FROM appointments a JOIN services s ON a.service_id = s.id
    WHERE a.date = ? AND a.status = 'confirmed' AND a.reminder_sent = 0
  `).all(tomorrowStr);

  for (const appt of pending) {
    const service = { name: appt.service_name, duration: appt.service_duration, color: appt.service_color };
    try {
      await sendReminderEmail(appt, service, BASE_URL);
      db.prepare('UPDATE appointments SET reminder_sent = 1 WHERE id = ?').run(appt.id);
    } catch (e) {
      console.error('Error recordatorio:', e.message);
    }
  }
});

app.listen(PORT, () => {
  getDb(); // Inicializar DB
  console.log(`\n✅ AgendaAI corriendo en ${BASE_URL}`);
  console.log(`🔑 Admin: ${BASE_URL}/admin\n`);
});
