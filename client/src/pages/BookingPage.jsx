import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Clock, ArrowLeft, Sparkles, Download } from 'lucide-react';
import ServiceCard from '../components/booking/ServiceCard';
import CalendarComponent from '../components/booking/Calendar';
import TimeSlots from '../components/booking/TimeSlots';
import ClientForm from '../components/booking/ClientForm';
import api from '../utils/api';
import { formatDate } from '../utils/dates';

const STEPS = ['Servicio', 'Fecha y hora', 'Tus datos'];

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [selected, setSelected] = useState({ service: null, date: null, time: null });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data)).catch(() => {});
    api.get('/public-settings').then(({ data }) => setSettings(data)).catch(() => {});
  }, []);

  async function handleConfirm(clientData) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/appointments', {
        service_id: selected.service.id,
        date: selected.date,
        time: selected.time,
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone || null,
        client_notes: clientData.notes || null,
      });
      setBooking(data.appointment);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al confirmar la cita. Intenta de nuevo.');
    }
    setLoading(false);
  }

  function canGoNext() {
    if (step === 0) return !!selected.service;
    if (step === 1) return !!selected.date && !!selected.time;
    return false;
  }

  function buildGoogleCalendarUrl() {
    if (!booking) return '#';
    const start = `${booking.date.replace(/-/g, '')}T${booking.time.replace(':', '')}00`;
    const end   = `${booking.date.replace(/-/g, '')}T${booking.end_time.replace(':', '')}00`;
    const text  = encodeURIComponent(`${booking.service_name} — ${settings.business_name || 'Cita'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}`;
  }

  function buildICSContent() {
    if (!booking) return '';
    const start = `${booking.date.replace(/-/g, '')}T${booking.time.replace(':', '')}00`;
    const end   = `${booking.date.replace(/-/g, '')}T${booking.end_time.replace(':', '')}00`;
    return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${booking.service_name}\nEND:VEVENT\nEND:VCALENDAR`;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-navy-700/40 px-4 py-3 sm:py-4 sticky top-0 z-20 bg-navy-950/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
              <Calendar size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm sm:text-base">
              {settings.business_name || 'AgendaAI'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:block">Disponible ahora</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 sm:py-8">
        {step < 3 && (
          <>
            {/* Progress steps */}
            <div className="mb-8">
              <div className="flex items-center gap-0 mb-3">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${i < step
                        ? 'bg-gradient-brand text-white shadow-glow-sm'
                        : i === step
                          ? 'bg-gradient-brand text-white ring-4 ring-indigo-500/20 shadow-glow-sm'
                          : 'bg-navy-700/80 text-slate-500 border border-navy-600/50'
                      }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-500
                        ${i < step ? 'bg-gradient-brand' : 'bg-navy-700'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs">
                {STEPS.map((s, i) => (
                  <span key={i}
                    className={`transition-colors ${i === step ? 'text-brand-light font-semibold' : 'text-slate-600'}`}
                    style={{ flex: 1, textAlign: i === 0 ? 'left' : i === STEPS.length - 1 ? 'right' : 'center' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero — solo step 0 */}
            {step === 0 && (
              <div className="mb-7 animate-slide-up">
                <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-3 py-1.5 mb-4">
                  <Sparkles size={13} className="text-brand-light" />
                  <span className="text-brand-light text-xs font-semibold">Reserva en 3 pasos</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {settings.welcome_message || 'Agenda tu cita'}
                </h1>
                <p className="text-slate-400 mt-2 text-sm">Sin llamadas. Sin esperas. Elige el horario que más te convenga.</p>
              </div>
            )}

            {/* Step 0: Servicios */}
            {step === 0 && (
              <div className="space-y-3 animate-slide-up">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
                  ¿Qué tipo de cita necesitas?
                </h2>
                {services.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-slate-500 text-sm">Cargando servicios...</p>
                  </div>
                ) : (
                  services.map(s => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      selected={selected.service?.id === s.id}
                      onClick={() => setSelected(prev => ({ ...prev, service: s }))}
                    />
                  ))
                )}
                {selected.service && (
                  <button onClick={() => setStep(1)} className="btn-primary w-full mt-4 animate-scale-in flex items-center justify-center gap-2">
                    Continuar <span className="opacity-70">→</span>
                  </button>
                )}
              </div>
            )}

            {/* Step 1: Fecha y hora */}
            {step === 1 && (
              <div className="animate-slide-up">
                {selected.service && (
                  <div className="flex items-center gap-3 mb-5 p-3 sm:p-4 bg-navy-800/60 rounded-2xl border border-navy-600/30">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${selected.service.color}20` }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selected.service.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{selected.service.name}</p>
                      <p className="text-xs text-slate-500">{selected.service.duration} min</p>
                    </div>
                    <button onClick={() => setStep(0)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      Cambiar
                    </button>
                  </div>
                )}

                <div className="card p-4 sm:p-5 mb-4">
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Elige un día</h2>
                  <CalendarComponent
                    selectedDate={selected.date}
                    onSelectDate={d => setSelected(prev => ({ ...prev, date: d, time: null }))}
                  />
                </div>

                {selected.date && (
                  <div className="card p-4 sm:p-5 mb-4 animate-scale-in">
                    <TimeSlots
                      date={selected.date}
                      selected={selected.time}
                      onSelect={t => setSelected(prev => ({ ...prev, time: t }))}
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2 px-4">
                    <ArrowLeft size={15} />
                    <span className="hidden sm:block">Volver</span>
                  </button>
                  {selected.date && selected.time && (
                    <button onClick={() => setStep(2)} className="btn-primary flex-1 animate-scale-in">
                      Continuar →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Datos del cliente */}
            {step === 2 && (
              <div className="animate-slide-up">
                {/* Resumen */}
                <div className="card p-4 mb-6">
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.service?.color }} />
                    <span className="font-semibold text-white">{selected.service?.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 bg-navy-700/50 rounded-lg px-2.5 py-1.5">
                      <Calendar size={12} />{formatDate(selected.date)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-navy-700/50 rounded-lg px-2.5 py-1.5">
                      <Clock size={12} />{selected.time} · {selected.service?.duration} min
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}

                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Tus datos</h2>
                <ClientForm onSubmit={handleConfirm} loading={loading} />

                <button onClick={() => setStep(1)} className="btn-ghost w-full mt-3 flex items-center justify-center gap-2 text-sm">
                  <ArrowLeft size={13} />Cambiar horario
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 3: Confirmación */}
        {step === 3 && booking && (
          <div className="animate-slide-up text-center">
            {/* Icono animado */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse" />
              <div className="relative w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle size={44} className="text-green-400 animate-bounce-in" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">¡Cita confirmada!</h1>
            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
              {settings.confirmation_message || 'Te esperamos puntualmente.'} Recibirás un email de confirmación.
            </p>

            {/* Detalle de la cita */}
            <div className="card p-5 text-left mb-5 space-y-3">
              <DetailRow label="Servicio" value={booking.service_name} highlight />
              <div className="border-t border-navy-600/40" />
              <DetailRow label="Fecha" value={formatDate(booking.date)} />
              <DetailRow label="Hora" value={`${booking.time} – ${booking.end_time}`} />
              <div className="border-t border-navy-600/40" />
              <DetailRow label="Nombre" value={booking.client_name} />
              <DetailRow label="Email" value={booking.client_email} />
            </div>

            {/* Añadir al calendario */}
            <div className="space-y-3 mb-6">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Añadir al calendario</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <a href={buildGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-sm flex items-center gap-2 px-4 py-2.5">
                  <Calendar size={14} />Google
                </a>
                <a href={`data:text/calendar;charset=utf8,${encodeURIComponent(buildICSContent())}`}
                  download="cita.ics"
                  className="btn-secondary text-sm flex items-center gap-2 px-4 py-2.5">
                  <Download size={14} />Apple / Outlook
                </a>
              </div>
            </div>

            <div className="pt-5 border-t border-navy-700/50">
              <p className="text-xs text-slate-600 mb-2">¿Necesitas cambiar algo?</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href={`/reschedule/${booking.token}`} className="text-brand-light text-sm hover:text-white transition-colors">
                  Reagendar
                </a>
                <span className="text-slate-700">·</span>
                <a href={`/cancel/${booking.token}`} className="text-red-400 text-sm hover:text-red-300 transition-colors">
                  Cancelar
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={highlight ? 'font-semibold text-white' : 'text-slate-200'}>{value}</span>
    </div>
  );
}
