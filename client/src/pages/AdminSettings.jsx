import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Clock, Globe,
  Mail, Building, Lock, AlertTriangle, CheckCircle
} from 'lucide-react';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AdminSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({});
  const [services, setServices] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newBlock, setNewBlock] = useState({ date: '', start_time: '', end_time: '', reason: '' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, srRes, blRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/services'),
        api.get('/admin/blocked-slots'),
      ]);
      setSettings(sRes.data);
      setServices(srRes.data);
      setBlocked(blRes.data);
    } catch {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
    setLoading(false);
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      showToast('Configuración guardada');
    } catch { showToast('Error al guardar', 'error'); }
    setSaving(false);
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) { showToast('Las contraseñas no coinciden', 'error'); return; }
    if (newPassword.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }
    setSaving(true);
    try {
      await api.put('/admin/settings/password', { password: newPassword });
      setNewPassword(''); setConfirmPassword('');
      showToast('Contraseña actualizada');
    } catch { showToast('Error al cambiar contraseña', 'error'); }
    setSaving(false);
  }

  async function saveService(service) {
    setSaving(true);
    try {
      if (service.id) {
        await api.put(`/admin/services/${service.id}`, service);
        setServices(prev => prev.map(s => s.id === service.id ? service : s));
      } else {
        const { data } = await api.post('/admin/services', service);
        setServices(prev => [...prev, data]);
      }
      showToast('Servicio guardado');
    } catch { showToast('Error al guardar servicio', 'error'); }
    setSaving(false);
  }

  async function deleteService(id) {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
      showToast('Servicio eliminado');
    } catch { showToast('Error al eliminar', 'error'); }
  }

  async function addBlock() {
    if (!newBlock.date || !newBlock.start_time || !newBlock.end_time) {
      showToast('Fecha y horarios requeridos', 'error'); return;
    }
    try {
      const { data } = await api.post('/admin/blocked-slots', newBlock);
      setBlocked(prev => [...prev, data]);
      setNewBlock({ date: '', start_time: '', end_time: '', reason: '' });
      showToast('Horario bloqueado');
    } catch { showToast('Error al bloquear', 'error'); }
  }

  async function deleteBlock(id) {
    try {
      await api.delete(`/admin/blocked-slots/${id}`);
      setBlocked(prev => prev.filter(b => b.id !== id));
    } catch { showToast('Error al eliminar bloqueo', 'error'); }
  }

  const TABS = [
    ['business', Building, 'Negocio'],
    ['hours', Clock, 'Horarios'],
    ['services', Globe, 'Servicios'],
    ['email', Mail, 'Email'],
    ['security', Lock, 'Seguridad'],
  ];

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <header className="border-b border-navy-700/50 px-4 py-3 sticky top-0 z-10 bg-navy-950/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/admin" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
          <h1 className="font-bold text-white">Configuración</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Tab nav */}
          <div className="flex gap-1 overflow-x-auto mb-6 bg-navy-800 p-1 rounded-xl">
            {TABS.map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${tab === key ? 'bg-brand text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Business */}
          {tab === 'business' && (
            <Section title="Información del negocio" onSave={saveSettings} saving={saving}>
              <Field label="Nombre del negocio">
                <input className="input" value={settings.business_name || ''} onChange={e => setSettings(s => ({ ...s, business_name: e.target.value }))} />
              </Field>
              <Field label="Mensaje de bienvenida">
                <input className="input" value={settings.welcome_message || ''} onChange={e => setSettings(s => ({ ...s, welcome_message: e.target.value }))} />
              </Field>
              <Field label="Mensaje de confirmación">
                <input className="input" value={settings.confirmation_message || ''} onChange={e => setSettings(s => ({ ...s, confirmation_message: e.target.value }))} />
              </Field>
              <Field label="Tiempo de anticipación mínima (horas)">
                <input type="number" min="0" className="input" value={settings.booking_notice_hours ?? 2} onChange={e => setSettings(s => ({ ...s, booking_notice_hours: parseInt(e.target.value) }))} />
              </Field>
              <Field label="Máximo de citas por franja">
                <input type="number" min="1" className="input" value={settings.max_bookings_per_slot ?? 1} onChange={e => setSettings(s => ({ ...s, max_bookings_per_slot: parseInt(e.target.value) }))} />
              </Field>
            </Section>
          )}

          {/* Hours */}
          {tab === 'hours' && (
            <Section title="Horario de atención" onSave={saveSettings} saving={saving}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Apertura">
                  <input type="time" className="input" value={settings.business_hours_start || '09:00'} onChange={e => setSettings(s => ({ ...s, business_hours_start: e.target.value }))} />
                </Field>
                <Field label="Cierre">
                  <input type="time" className="input" value={settings.business_hours_end || '18:00'} onChange={e => setSettings(s => ({ ...s, business_hours_end: e.target.value }))} />
                </Field>
                <Field label="Buffer entre citas (min)">
                  <input type="number" min="0" step="5" className="input" value={settings.buffer_time_minutes ?? 0} onChange={e => setSettings(s => ({ ...s, buffer_time_minutes: parseInt(e.target.value) }))} />
                </Field>
                <Field label="Slot de citas (min)">
                  <input type="number" min="15" step="15" className="input" value={settings.slot_duration_minutes ?? 30} onChange={e => setSettings(s => ({ ...s, slot_duration_minutes: parseInt(e.target.value) }))} />
                </Field>
              </div>

              <div className="mt-4">
                <p className="label mb-2">Días activos</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => {
                    const days = settings.working_days || '1,2,3,4,5';
                    const active = days.split(',').map(Number).includes(i + 1);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const arr = days.split(',').map(Number);
                          const n = i + 1;
                          const next = active ? arr.filter(x => x !== n) : [...arr, n].sort();
                          setSettings(s => ({ ...s, working_days: next.join(',') }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all border
                          ${active ? 'bg-brand/20 border-brand text-brand' : 'border-navy-600 text-slate-500 hover:text-white'}`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blocked slots */}
              <div className="mt-6">
                <h3 className="font-semibold text-white text-sm mb-3">Horarios bloqueados</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <input type="date" className="input text-sm" value={newBlock.date} onChange={e => setNewBlock(b => ({ ...b, date: e.target.value }))} />
                  <input type="time" className="input text-sm" value={newBlock.start_time} onChange={e => setNewBlock(b => ({ ...b, start_time: e.target.value }))} />
                  <input type="time" className="input text-sm" value={newBlock.end_time} onChange={e => setNewBlock(b => ({ ...b, end_time: e.target.value }))} />
                  <input className="input text-sm" placeholder="Razón (opcional)" value={newBlock.reason} onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))} />
                </div>
                <button onClick={addBlock} className="btn-secondary text-sm flex items-center gap-1.5 mb-4">
                  <Plus size={14} />Bloquear franja
                </button>
                {blocked.length > 0 && (
                  <div className="space-y-2">
                    {blocked.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-navy-800 rounded-xl px-4 py-2.5 text-sm">
                        <span className="text-white">{b.date}</span>
                        <span className="text-slate-400">{b.start_time} – {b.end_time}</span>
                        {b.reason && <span className="text-slate-500 hidden sm:block">{b.reason}</span>}
                        <button onClick={() => deleteBlock(b.id)} className="text-red-400 hover:text-red-300 ml-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Services */}
          {tab === 'services' && (
            <div className="space-y-4">
              {services.map(service => (
                <ServiceEditor
                  key={service.id}
                  service={service}
                  onSave={saveService}
                  onDelete={deleteService}
                  saving={saving}
                />
              ))}
              <button
                onClick={() => saveService({ name: 'Nuevo servicio', duration: 60, price: 0, color: '#3B82F6', active: true })}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />Añadir servicio
              </button>
            </div>
          )}

          {/* Email */}
          {tab === 'email' && (
            <Section title="Configuración de email" onSave={saveSettings} saving={saving}>
              <Field label="Servidor SMTP">
                <input className="input" placeholder="smtp.gmail.com" value={settings.smtp_host || ''} onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))} />
              </Field>
              <Field label="Puerto SMTP">
                <input type="number" className="input" placeholder="587" value={settings.smtp_port || ''} onChange={e => setSettings(s => ({ ...s, smtp_port: parseInt(e.target.value) }))} />
              </Field>
              <Field label="Usuario SMTP">
                <input className="input" placeholder="tu@email.com" value={settings.smtp_user || ''} onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))} />
              </Field>
              <Field label="Contraseña SMTP">
                <input type="password" className="input" placeholder="••••••••" value={settings.smtp_pass || ''} onChange={e => setSettings(s => ({ ...s, smtp_pass: e.target.value }))} />
              </Field>
              <Field label="Email del negocio (remitente)">
                <input className="input" placeholder="negocio@email.com" value={settings.admin_email || ''} onChange={e => setSettings(s => ({ ...s, admin_email: e.target.value }))} />
              </Field>
              <p className="text-xs text-slate-500 mt-2">Para Gmail usa contraseña de aplicación. Para otros proveedores consulta su documentación SMTP.</p>
            </Section>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-4">Cambiar contraseña</h2>
              <div className="space-y-3">
                <Field label="Nueva contraseña">
                  <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </Field>
                <Field label="Confirmar contraseña">
                  <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </Field>
                <button onClick={savePassword} disabled={saving || !newPassword} className="btn-primary flex items-center gap-2">
                  {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : <><Save size={15} />Actualizar contraseña</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children, onSave, saving }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
      <button onClick={onSave} disabled={saving} className="btn-primary mt-5 flex items-center gap-2">
        {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</> : <><Save size={15} />Guardar cambios</>}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ServiceEditor({ service: init, onSave, onDelete, saving }) {
  const [s, setS] = useState(init);
  const [open, setOpen] = useState(!init.id);
  const changed = JSON.stringify(s) !== JSON.stringify(init);

  return (
    <div className="card">
      <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setOpen(!open)}>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
        <span className="font-medium text-white flex-1">{s.name}</span>
        <span className="text-slate-500 text-xs">{s.duration} min · {s.active ? 'Activo' : 'Inactivo'}</span>
      </button>

      {open && (
        <div className="border-t border-navy-700 p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre">
              <input className="input text-sm" value={s.name} onChange={e => setS(x => ({ ...x, name: e.target.value }))} />
            </Field>
            <Field label="Duración (min)">
              <input type="number" min="15" step="15" className="input text-sm" value={s.duration} onChange={e => setS(x => ({ ...x, duration: parseInt(e.target.value) }))} />
            </Field>
            <Field label="Precio">
              <input type="number" min="0" className="input text-sm" value={s.price ?? 0} onChange={e => setS(x => ({ ...x, price: parseFloat(e.target.value) }))} />
            </Field>
          </div>

          <Field label="Descripción">
            <input className="input text-sm" placeholder="Descripción del servicio..." value={s.description || ''} onChange={e => setS(x => ({ ...x, description: e.target.value }))} />
          </Field>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setS(x => ({ ...x, color: c }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: s.color === c ? '2px solid white' : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setS(x => ({ ...x, active: !x.active }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${s.active ? 'bg-brand' : 'bg-navy-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-slate-400">{s.active ? 'Activo' : 'Inactivo'}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onSave(s)}
              disabled={saving || !changed}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Save size={13} />Guardar
            </button>
            {init.id && (
              <button onClick={() => onDelete(s.id)} className="btn-ghost text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5">
                <Trash2 size={13} />Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
