import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { XCircle, CheckCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/dates';
import Spinner from '../components/ui/Spinner';

export default function CancelPage() {
  const { token } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/appointment/${token}`)
      .then(({ data }) => { setAppointment(data); setStatus('confirm'); })
      .catch(() => { setError('Cita no encontrada o enlace inválido'); setStatus('error'); });
  }, [token]);

  async function handleCancel() {
    setStatus('loading');
    try {
      await api.post(`/cancel/${token}`);
      setStatus('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cancelar');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm animate-scale-in">
        {status === 'loading' && (
          <div className="card p-10 text-center">
            <Spinner size="lg" className="mx-auto" />
          </div>
        )}

        {status === 'confirm' && appointment && (
          <div className="card p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Cancelar cita</h2>
              <p className="text-slate-400 text-sm mt-1">¿Confirmas que deseas cancelar?</p>
            </div>

            <div className="bg-navy-900/60 rounded-2xl p-4 mb-6 space-y-2.5 border border-navy-700/40">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Servicio</span>
                <span className="text-white font-medium">{appointment.service_name}</span>
              </div>
              <div className="border-t border-navy-700/40" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={12} />Fecha</span>
                <span className="text-white">{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><Clock size={12} />Hora</span>
                <span className="text-white">{appointment.time}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button onClick={handleCancel} className="btn-danger w-full">
                Sí, cancelar cita
              </button>
              <a href="/" className="btn-ghost w-full block text-center text-sm">
                Volver sin cancelar
              </a>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="card p-6 sm:p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Cita cancelada</h2>
            <p className="text-slate-400 text-sm mb-6">Tu cita ha sido cancelada correctamente.</p>
            <a href="/" className="btn-primary block text-center">Agendar nueva cita</a>
          </div>
        )}

        {status === 'error' && (
          <div className="card p-6 sm:p-8 text-center">
            <XCircle size={36} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <a href="/" className="btn-secondary block text-center">Ir al inicio</a>
          </div>
        )}
      </div>
    </div>
  );
}
