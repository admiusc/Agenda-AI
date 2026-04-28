import { Clock, Check } from 'lucide-react';

export default function ServiceCard({ service, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 group
        ${selected
          ? 'service-selected'
          : 'border-navy-600/50 bg-navy-800/50 hover:border-navy-500 hover:bg-navy-700/60'
        }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ backgroundColor: `${service.color}1a`, border: `1.5px solid ${service.color}40` }}
        >
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: service.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-sm sm:text-base leading-tight transition-colors
              ${selected ? 'text-white' : 'text-slate-100 group-hover:text-white'}`}>
              {service.name}
            </h3>
            {selected
              ? <div className="w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
              : null
            }
          </div>

          {service.description && (
            <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />{service.duration} min
            </span>
            {service.price > 0 && (
              <span className="text-xs font-bold text-brand-light">${service.price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
