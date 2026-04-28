const nodemailer = require('nodemailer');
const { getDb } = require('../database/schema');

function getSetting(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function createTransporter() {
  const host = getSetting('smtp_host');
  const port = parseInt(getSetting('smtp_port') || '587');
  const user = getSetting('smtp_user');
  const pass = getSetting('smtp_pass');

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatDate(dateStr, timeStr) {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} — ${timeStr}`;
}

function buildConfirmationEmail(appointment, service, cancelUrl, rescheduleUrl) {
  const businessName = getSetting('business_name');
  const confirmMsg = getSetting('confirmation_message');

  return {
    subject: `✅ Cita confirmada — ${service.name} | ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#3B82F6;border-radius:12px;padding:12px 24px;">
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">📅 AgendaAI</span>
      </div>
    </div>

    <div style="background:#1E293B;border-radius:16px;padding:36px;margin-bottom:24px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;background:#10B981;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">✓</div>
        <h1 style="color:white;font-size:24px;font-weight:700;margin:0 0 8px;">¡Cita Confirmada!</h1>
        <p style="color:#94A3B8;font-size:15px;margin:0;">${confirmMsg}</p>
      </div>

      <div style="background:#0F172A;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <div style="width:40px;height:40px;background:${service.color}22;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;">
            <span style="font-size:18px;">🗂️</span>
          </div>
          <div>
            <p style="color:#94A3B8;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1px;">Servicio</p>
            <p style="color:white;font-size:16px;font-weight:600;margin:2px 0 0;">${service.name}</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <div style="width:40px;height:40px;background:#3B82F622;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;">
            <span style="font-size:18px;">📆</span>
          </div>
          <div>
            <p style="color:#94A3B8;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1px;">Fecha y hora</p>
            <p style="color:white;font-size:16px;font-weight:600;margin:2px 0 0;">${formatDate(appointment.date, appointment.time)}</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;">
          <div style="width:40px;height:40px;background:#8B5CF622;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:12px;">
            <span style="font-size:18px;">⏱️</span>
          </div>
          <div>
            <p style="color:#94A3B8;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1px;">Duración</p>
            <p style="color:white;font-size:16px;font-weight:600;margin:2px 0 0;">${service.duration} minutos</p>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <p style="color:#94A3B8;font-size:13px;margin:0 0 16px;">¿Necesitas hacer cambios?</p>
        <a href="${rescheduleUrl}" style="display:inline-block;background:#3B82F6;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-right:8px;">Reagendar</a>
        <a href="${cancelUrl}" style="display:inline-block;background:#1E293B;color:#EF4444;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #EF444444;">Cancelar</a>
      </div>
    </div>

    <p style="color:#475569;font-size:13px;text-align:center;margin:0;">${businessName} · Enviado automáticamente por AgendaAI</p>
  </div>
</body>
</html>`
  };
}

function buildAdminNotificationEmail(appointment, service) {
  const businessName = getSetting('business_name');
  return {
    subject: `🔔 Nueva cita: ${appointment.client_name} — ${service.name}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid #334155;">
      <h2 style="color:white;margin:0 0 24px;">🔔 Nueva cita agendada</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#94A3B8;padding:8px 0;width:140px;">Cliente</td><td style="color:white;font-weight:600;">${appointment.client_name}</td></tr>
        <tr><td style="color:#94A3B8;padding:8px 0;">Email</td><td style="color:white;">${appointment.client_email}</td></tr>
        <tr><td style="color:#94A3B8;padding:8px 0;">Teléfono</td><td style="color:white;">${appointment.client_phone || '—'}</td></tr>
        <tr><td style="color:#94A3B8;padding:8px 0;">Servicio</td><td style="color:white;">${service.name}</td></tr>
        <tr><td style="color:#94A3B8;padding:8px 0;">Fecha</td><td style="color:white;font-weight:600;">${formatDate(appointment.date, appointment.time)}</td></tr>
        ${appointment.client_notes ? `<tr><td style="color:#94A3B8;padding:8px 0;">Notas</td><td style="color:white;font-style:italic;">"${appointment.client_notes}"</td></tr>` : ''}
      </table>
    </div>
  </div>
</body>
</html>`
  };
}

function buildReminderEmail(appointment, service, cancelUrl) {
  const businessName = getSetting('business_name');
  return {
    subject: `⏰ Recordatorio: tu cita mañana — ${formatDate(appointment.date, appointment.time)}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">⏰</span>
        <h2 style="color:white;margin:16px 0 8px;">Recordatorio de cita</h2>
        <p style="color:#94A3B8;margin:0;">Hola ${appointment.client_name}, te recordamos que tienes una cita mañana.</p>
      </div>
      <div style="background:#0F172A;border-radius:12px;padding:20px;text-align:center;">
        <p style="color:#3B82F6;font-size:20px;font-weight:700;margin:0 0 4px;">${service.name}</p>
        <p style="color:white;font-size:18px;font-weight:600;margin:0;">${formatDate(appointment.date, appointment.time)}</p>
        <p style="color:#94A3B8;font-size:14px;margin:8px 0 0;">Duración: ${service.duration} minutos</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${cancelUrl}" style="color:#EF4444;font-size:13px;">¿No puedes asistir? Cancela aquí</a>
      </div>
    </div>
    <p style="color:#475569;font-size:13px;text-align:center;margin-top:16px;">${businessName}</p>
  </div>
</body>
</html>`
  };
}

async function sendConfirmationEmail(appointment, service, baseUrl) {
  const transporter = createTransporter();
  if (!transporter) return { success: false, reason: 'Email no configurado' };

  const cancelUrl = `${baseUrl}/cancel/${appointment.token}`;
  const rescheduleUrl = `${baseUrl}/reschedule/${appointment.token}`;
  const fromEmail = getSetting('smtp_from') || getSetting('smtp_user');
  const adminEmail = getSetting('business_email');

  const clientEmail = buildConfirmationEmail(appointment, service, cancelUrl, rescheduleUrl);
  const adminEmail2 = buildAdminNotificationEmail(appointment, service);

  try {
    await transporter.sendMail({
      from: `"${getSetting('business_name')}" <${fromEmail}>`,
      to: appointment.client_email,
      subject: clientEmail.subject,
      html: clientEmail.html,
    });
    await transporter.sendMail({
      from: `"AgendaAI" <${fromEmail}>`,
      to: adminEmail,
      subject: adminEmail2.subject,
      html: adminEmail2.html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error enviando email:', err.message);
    return { success: false, reason: err.message };
  }
}

async function sendReminderEmail(appointment, service, baseUrl) {
  const transporter = createTransporter();
  if (!transporter) return;

  const cancelUrl = `${baseUrl}/cancel/${appointment.token}`;
  const fromEmail = getSetting('smtp_from') || getSetting('smtp_user');
  const email = buildReminderEmail(appointment, service, cancelUrl);

  try {
    await transporter.sendMail({
      from: `"${getSetting('business_name')}" <${fromEmail}>`,
      to: appointment.client_email,
      subject: email.subject,
      html: email.html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error enviando recordatorio:', err.message);
  }
}

module.exports = { sendConfirmationEmail, sendReminderEmail };
