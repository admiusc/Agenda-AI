const { getDb } = require('../database/schema');

function getSetting(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function getAvailableSlots(dateStr) {
  const db = getDb();

  const startTime = getSetting('business_hours_start') || '09:00';
  const endTime   = getSetting('business_hours_end')   || '18:00';
  const duration  = parseInt(getSetting('slot_duration_minutes')  || '30');
  const buffer    = parseInt(getSetting('buffer_time_minutes')    || '0');
  const maxPerSlot = parseInt(getSetting('max_bookings_per_slot') || '1');
  const noticeHours = parseInt(getSetting('booking_notice_hours') || '2');

  const workingDays = (getSetting('working_days') || '1,2,3,4,5').split(',').map(Number);
  const date = new Date(dateStr + 'T12:00:00');
  if (!workingDays.includes(date.getDay())) return [];

  const existing = db.prepare(
    `SELECT time, end_time FROM appointments WHERE date = ? AND status NOT IN ('cancelled')`
  ).all(dateStr);

  const blocked = db.prepare(
    `SELECT start_time, end_time FROM blocked_slots WHERE date = ?`
  ).all(dateStr);

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH,   endM]   = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes   = endH   * 60 + endM;

  const now = new Date();
  const noticeMs = noticeHours * 60 * 60 * 1000;
  const slots = [];

  for (let m = startMinutes; m + duration <= endMinutes; m += duration + buffer) {
    const h   = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    const slotTime = `${h}:${min}`;

    const endM2  = m + duration;
    const eH     = Math.floor(endM2 / 60).toString().padStart(2, '0');
    const eMin   = (endM2 % 60).toString().padStart(2, '0');
    const slotEnd = `${eH}:${eMin}`;

    const slotDate = new Date(`${dateStr}T${slotTime}:00`);
    if (slotDate.getTime() - now.getTime() < noticeMs) continue;

    const isBlocked = blocked.some(b =>
      slotTime < (b.end_time || slotEnd) && slotEnd > b.start_time
    );
    if (isBlocked) continue;

    const takenCount = existing.filter(appt =>
      slotTime < appt.end_time && slotEnd > appt.time
    ).length;
    if (takenCount >= maxPerSlot) continue;

    slots.push({ time: slotTime, endTime: slotEnd });
  }

  return slots;
}

function getAvailableDays(year, month) {
  const db = getDb();
  const workingDays   = (getSetting('working_days') || '1,2,3,4,5').split(',').map(Number);
  const advanceDays   = parseInt(getSetting('advance_booking_days') || '30');
  const maxPerSlot    = parseInt(getSetting('max_bookings_per_slot') || '1');
  const duration      = parseInt(getSetting('slot_duration_minutes') || '30');
  const buffer        = parseInt(getSetting('buffer_time_minutes')   || '0');
  const startTime     = getSetting('business_hours_start') || '09:00';
  const endTime       = getSetting('business_hours_end')   || '18:00';

  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const totalSlots = Math.floor(((eH * 60 + eM) - (sH * 60 + sM)) / (duration + buffer));

  const now     = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + advanceDays);

  const daysInMonth = new Date(year, month, 0).getDate();
  const result = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const date    = new Date(dateStr + 'T12:00:00');

    if (date < now || date > maxDate) { result[dateStr] = 'unavailable'; continue; }
    if (!workingDays.includes(date.getDay())) { result[dateStr] = 'closed'; continue; }

    const taken = db.prepare(
      `SELECT COUNT(*) as c FROM appointments WHERE date = ? AND status NOT IN ('cancelled')`
    ).get(dateStr).c;

    result[dateStr] = taken >= totalSlots * maxPerSlot ? 'full' : 'available';
  }

  return result;
}

module.exports = { getAvailableSlots, getAvailableDays };
