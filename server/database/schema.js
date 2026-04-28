const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'agenda.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL DEFAULT 30,
      price REAL DEFAULT 0,
      color TEXT DEFAULT '#3B82F6',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      service_id INTEGER REFERENCES services(id),
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      client_notes TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      reminder_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      reason TEXT
    );
  `);

  const defaults = [
    ['business_name', 'Mi Negocio'],
    ['admin_email', 'negocio@ejemplo.com'],
    ['admin_password', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'],
    ['working_days', '1,2,3,4,5'],
    ['business_hours_start', '09:00'],
    ['business_hours_end', '18:00'],
    ['slot_duration_minutes', '30'],
    ['buffer_time_minutes', '0'],
    ['max_bookings_per_slot', '1'],
    ['booking_notice_hours', '2'],
    ['advance_booking_days', '30'],
    ['welcome_message', 'Reserva tu cita en minutos. Sin complicaciones.'],
    ['confirmation_message', '¡Cita confirmada! Te esperamos puntualmente.'],
    ['smtp_host', ''],
    ['smtp_port', '587'],
    ['smtp_user', ''],
    ['smtp_pass', ''],
    ['business_name', 'Mi Negocio'],
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of defaults) {
    insert.run(key, value);
  }

  const row = db.prepare('SELECT COUNT(*) as c FROM services').get();
  if (row.c === 0) {
    db.prepare('INSERT INTO services (name, description, duration, color) VALUES (?, ?, ?, ?)')
      .run('Consulta Inicial', 'Primera reunión para conocer tus necesidades y objetivos.', 60, '#3B82F6');
    db.prepare('INSERT INTO services (name, description, duration, color) VALUES (?, ?, ?, ?)')
      .run('Seguimiento', 'Reunión de seguimiento sobre proyectos en curso.', 30, '#8B5CF6');
    db.prepare('INSERT INTO services (name, description, duration, color) VALUES (?, ?, ?, ?)')
      .run('Asesoría Especializada', 'Sesión de asesoría profunda sobre un tema específico.', 90, '#10B981');
  }
}

module.exports = { getDb };
