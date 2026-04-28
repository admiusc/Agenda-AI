import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS, DAYS, getDaysInMonth, getFirstDayOfMonth, todayStr } from '../../utils/dates';
import api from '../../utils/api';
import Spinner from '../ui/Spinner';

export default function Calendar({ onSelectDate, selectedDate }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAvailability(); }, [year, month]);

  async function loadAvailability() {
    setLoading(true);
    try {
      const { data } = await api.get(`/availability/${year}/${month}`);
      setAvailability(data);
    } catch {}
    setLoading(false);
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const todayS      = todayStr();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="animate-fade-in">
      {/* Navegación mes */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth}
          className="w-9 h-9 rounded-xl bg-navy-700/60 border border-navy-600/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-navy-600 transition-all active:scale-95">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-white text-base">
            {MONTHS[month - 1]} {year}
          </h3>
          {loading && <Spinner size="sm" className="mx-auto mt-1" />}
        </div>
        <button onClick={nextMonth}
          className="w-9 h-9 rounded-xl bg-navy-700/60 border border-navy-600/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-navy-600 transition-all active:scale-95">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-600 py-1">{d}</div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;

          const dateStr    = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const status     = availability[dateStr];
          const isSelected = dateStr === selectedDate;
          const isToday    = dateStr === todayS;
          const isAvail    = status === 'available';

          return (
            <button
              key={dateStr}
              onClick={() => isAvail && onSelectDate(dateStr)}
              disabled={!isAvail}
              className={`
                relative flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium
                transition-all duration-150 select-none
                h-9 sm:h-10
                ${isSelected
                  ? 'text-white scale-105 shadow-glow-sm'
                  : isAvail
                    ? 'text-slate-200 hover:bg-navy-600/60 hover:text-white cursor-pointer active:scale-95'
                    : 'text-navy-600 cursor-not-allowed'
                }
                ${status === 'full' ? 'line-through text-slate-700' : ''}
              `}
              style={isSelected ? { background: 'linear-gradient(135deg, #6366f1, #3b82f6)' } : {}}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 sm:gap-4 mt-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }} />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-navy-700" />
          No disponible
        </span>
      </div>
    </div>
  );
}
