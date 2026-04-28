import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, User, Mail, Phone, CheckCircle,
  XCircle, AlertCircle, RefreshCw, Settings, LogOut,
  TrendingUp, BarChart2, FileText, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/dates';
import Spinner from '../components/ui/Spinner';

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertCircle },
  confirmed: { label: 'Confirmada', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  icon: CheckCircle },
  cancelled: { label: 'Cancelada',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',      icon: XCircle },
  completed: { label: 'Completada', color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/30',  icon: CheckCircle },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('appointments'); // appointments | analytics
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [apptRes, analyticsRes] = await Promise.all([
        api.get('/admin/appointments'),
        api.get('/admin/analytics'),
      ]);
      setAppointments(apptRes.data);
      setAnalytics(analyticsRes.data);
    } catch {
      handleAuthError();
    }
    setLoading(false);
  }

  function handleAuthError() {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  }

  function logout() {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  }

  async function updateStatus(id, status) {
    setSavingId(id);
    try {
      await api.patch(`/admin/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { /* ignore */ }
    setSavingId(null);
  }

  async function saveNotes(id, notes) {
    setSavingId(id);
    try {
      await api.patch(`/admin/appointments/${id}`, { notes });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
    } catch { /* ignore */ }
    setSavingId(null);
  }

  const filtered = appointments.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || a.client_name?.toLowerCase().includes(q) || a.client_email?.toLowerCase().includes(q) || a.service_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="border-b border-navy-700/50 px-4 py-3 sticky top-0 z-10 bg-navy-950/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">AgendaAI</span>
            <span className="text-slate-600 text-sm hidden sm:block">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/settings" className="btn-ghost text-sm flex items-center gap-1.5 px-3 py-1.5">
              <Settings size={15} />
              <span className="hidden sm:block">Ajustes</span>
            </Link>
            <button onClick={logout} className="btn-ghost text-sm flex items-center gap-1.5 px-3 py-1.5">
              <LogOut size={15} />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats summary */}
        {analytics && <StatsBar analytics={analytics} />}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-navy-800 p-1 rounded-xl w-fit">
          {[['appointments', <Calendar size={15} />, 'Citas'], ['analytics', <BarChart2 size={15} />, 'Estadísticas']].map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === key ? 'bg-brand text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
        ) : tab === 'appointments' ? (
          <AppointmentsTab
            appointments={filtered}
            total={appointments.length}
            search={search}
            setSearch={setSearch}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            savingId={savingId}
            updateStatus={updateStatus}
            saveNotes={saveNotes}
            onRefresh={loadData}
          />
        ) : (
          <AnalyticsTab analytics={analytics} />
        )}
      </main>
    </div>
  );
}

function StatsBar({ analytics }) {
  const stats = [
    { label: 'Total', value: analytics.totals?.total ?? 0, color: 'text-white' },
    { label: 'Pendientes', value: analytics.totals?.pending ?? 0, color: 'text-yellow-400' },
    { label: 'Confirmadas', value: analytics.totals?.confirmed ?? 0, color: 'text-green-400' },
    { label: 'Canceladas', value: analytics.totals?.cancelled ?? 0, color: 'text-red-400' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="card p-4">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function AppointmentsTab({ appointments, total, search, setSearch, filterStatus, setFilterStatus, expandedId, setExpandedId, savingId, updateStatus, saveNotes, onRefresh }) {
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 text-sm"
            placeholder="Buscar cliente, email o servicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input text-sm w-full sm:w-44"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([k, { label }]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <button onClick={onRefresh} className="btn-secondary flex items-center gap-2 text-sm px-3">
          <RefreshCw size={14} />
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">{appointments.length} de {total} citas</p>

      {appointments.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No hay citas que coincidan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map(a => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              expanded={expandedId === a.id}
              onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              saving={savingId === a.id}
              onUpdateStatus={updateStatus}
              onSaveNotes={saveNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appointment: a, expanded, onToggle, saving, onUpdateStatus, onSaveNotes }) {
  const [notes, setNotes] = useState(a.admin_notes || '');
  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <div className={`card transition-all ${expanded ? 'ring-1 ring-brand/30' : ''}`}>
      {/* Header row */}
      <button className="w-full p-4 flex items-center gap-3 text-left" onClick={onToggle}>
        <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm truncate">{a.client_name}</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-400 text-xs">{a.service_name}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(a.date)}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{a.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          {saving ? <Spinner size="sm" /> : expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-navy-700 p-4 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Detail icon={<Mail size={13} />} label="Email" value={a.client_email} />
            {a.client_phone && <Detail icon={<Phone size={13} />} label="Teléfono" value={a.client_phone} />}
            <Detail icon={<Clock size={13} />} label="Duración" value={`${a.time} – ${a.end_time}`} />
            <Detail icon={<Calendar size={13} />} label="Reservado" value={a.created_at ? new Date(a.created_at).toLocaleDateString('es-CO') : '—'} />
          </div>

          {a.client_notes && (
            <div className="bg-navy-900 rounded-xl p-3 text-sm">
              <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><FileText size={11} />Nota del cliente</p>
              <p className="text-slate-300">{a.client_notes}</p>
            </div>
          )}

          {/* Admin notes */}
          <div>
            <label className="label text-xs mb-1"><FileText size={11} className="inline mr-1" />Notas internas</label>
            <textarea
              className="input text-sm resize-none"
              rows={2}
              placeholder="Notas privadas sobre esta cita..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button
              onClick={() => onSaveNotes(a.id, notes)}
              disabled={saving || notes === (a.admin_notes || '')}
              className="btn-secondary text-xs mt-1.5 px-3 py-1.5"
            >
              Guardar nota
            </button>
          </div>

          {/* Status change */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([k, { label, color }]) => (
                <button
                  key={k}
                  disabled={saving || a.status === k}
                  onClick={() => onUpdateStatus(a.id, k)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                    ${a.status === k
                      ? `border-current ${color} opacity-60 cursor-default`
                      : 'border-navy-600 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-white">{value}</p>
      </div>
    </div>
  );
}

function AnalyticsTab({ analytics }) {
  if (!analytics) return null;
  const { totals, cancellationRate, topServices, topTimes, dailyStats } = analytics;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Tasa de cancelación" value={`${cancellationRate ?? 0}%`} icon={<TrendingUp size={18} />} />
        <KpiCard label="Servicios activos" value={topServices?.length ?? 0} icon={<BarChart2 size={18} />} />
        <KpiCard label="Completadas" value={totals?.completed ?? 0} icon={<CheckCircle size={18} />} className="col-span-2 sm:col-span-1" />
      </div>

      {/* Top services */}
      {topServices?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Servicios más solicitados</h3>
          <div className="space-y-3">
            {topServices.map((s, i) => (
              <div key={s.service_name} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{s.service_name}</span>
                    <span className="text-slate-400">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${(s.count / (topServices[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top times */}
      {topTimes?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Horarios más populares</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {topTimes.slice(0, 10).map(t => (
              <div key={t.time} className="bg-navy-800 rounded-xl p-3 text-center">
                <p className="text-brand font-bold text-sm">{t.time}</p>
                <p className="text-slate-500 text-xs mt-0.5">{t.count} citas</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily trend */}
      {dailyStats?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Citas últimos 30 días</h3>
          <div className="flex items-end gap-1 h-24">
            {dailyStats.map(d => {
              const max = Math.max(...dailyStats.map(x => x.count), 1);
              const pct = (d.count / max) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-brand/60 hover:bg-brand rounded-sm transition-all"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-xs text-slate-600 absolute -bottom-5 hidden group-hover:block whitespace-nowrap">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, className = '' }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">{label}</p>
        <span className="text-brand">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
