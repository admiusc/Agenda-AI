import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import CalendarComponent from '../components/booking/Calendar';
import TimeSlots from '../components/booking/TimeSlots';
import Spinner from '../components/ui/Spinner';
import { formatDate } from '../utils/dates';

export default function ReschedulePage() {
  const { token } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [pageStatus, setPageStatus] = useState('loading');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/appointment/${token}`)
      .then(({ data }) => {
        if (data.status === 'cancelled') { setPageStatus('cancelled'); return; }
        setAppointment(data);
        setPageStatus('form');
      })
      .catch(() => setPageStatus('error'));
  }, [token]);

  async function handleReschedule() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/reschedule/${token}`, { date, time });
      setPageStatus('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reagendar');
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        <a href="/" className="btn-ghost flex items-center gap-2 mb-6 w-fit">
          <ArrowLeft size={16} />AgendaAI
        </a>

        {pageStatus === 'loading' && <div className="flex justify-center pt-16"><Spinner size="lg" /></div>}

        {pageStatus === 'form' && appointment && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Reagendar cita</h1>
            <p className="text-slate-400 text-sm mb-6">
              Cita actual: <span className="text-white">{formatDate(appointment.date)} · {appointment.time}</span>
            </p>

            <div className="card p-5 mb-4">
              <h2 className="font-semibold text-white mb-4">Nuevo día</h2>
              <CalendarComponent
                selectedDate={date}
                onSelectDate={(d) => { setDate(d); setTime(null); }}
              />
            </div>

            {date && (
              <div className="card p-5 mb-4">
                <TimeSlots date={date} selected={time} onSelect={setTime} />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            {date && time && (
              <button
                onClick={handleReschedule}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : 'Confirmar nuevo horario'}
              </button>
            )}
          </>
        )}

        {pageStatus === 'done' && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Reagendado!</h2>
            <p className="text-slate-400 text-sm mb-4">
              Nueva cita: <span className="text-white font-medium">{formatDate(date)} · {time}</span>
            </p>
            <a href="/" className="btn-secondary block text-center mt-4">Ir al inicio</a>
          </div>
        )}

        {(pageStatus === 'error' || pageStatus === 'cancelled') && (
          <div className="card p-8 text-center">
            <p className="text-red-400 mb-4">
              {pageStatus === 'cancelled' ? 'Esta cita ya fue cancelada.' : 'Cita no encontrada.'}
            </p>
            <a href="/" className="btn-primary block text-center">Ir al inicio</a>
          </div>
        )}
      </div>
    </div>
  );
}
