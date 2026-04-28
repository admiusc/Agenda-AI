import { useEffect, useState } from 'react';
import { Clock, Sun, Sunset } from 'lucide-react';
import api from '../../utils/api';
import Spinner from '../ui/Spinner';
import { formatDate } from '../../utils/dates';

export default function TimeSlots({ date, onSelect, selected }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    api.get(`/slots/${date}`)
      .then(({ data }) => setSlots(data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date]);

  if (!date) return null;

  const morning   = slots.filter(s => parseInt(s.time) < 12);
  const afternoon = slots.filter(s => parseInt(s.time) >= 12);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
          <Clock size={13} className="text-white" />
        </div>
        <span className="text-sm font-medium text-slate-200">{formatDate(date)}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-navy-700/60 flex items-center justify-center mx-auto mb-3">
            <Clock size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Sin horarios disponibles</p>
          <p className="text-slate-600 text-xs mt-1">Prueba con otro día</p>
        </div>
      ) : (
        <div className="space-y-5">
          {morning.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sun size={13} className="text-amber-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Mañana</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {morning.map((slot, i) => (
                  <SlotButton
                    key={slot.time}
                    slot={slot}
                    selected={selected === slot.time}
                    onClick={() => onSelect(slot.time)}
                    delay={i * 30}
                  />
                ))}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sunset size={13} className="text-orange-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tarde</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {afternoon.map((slot, i) => (
                  <SlotButton
                    key={slot.time}
                    slot={slot}
                    selected={selected === slot.time}
                    onClick={() => onSelect(slot.time)}
                    delay={i * 30}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlotButton({ slot, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all duration-150 text-center
        ${selected
          ? 'slot-selected text-white scale-105'
          : 'bg-navy-900/80 border border-navy-600/50 text-slate-300 hover:border-indigo-400/50 hover:text-white hover:bg-navy-700/80'
        }`}
    >
      {slot.time}
    </button>
  );
}
