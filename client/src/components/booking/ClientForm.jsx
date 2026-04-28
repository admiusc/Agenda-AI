import { useState } from 'react';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';

export default function ClientForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.email.trim()) e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
      <div>
        <label className="label">
          <User size={13} className="inline mr-1.5" />Nombre completo *
        </label>
        <input
          className={`input ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
          placeholder="Tu nombre"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="label">
          <Mail size={13} className="inline mr-1.5" />Email *
        </label>
        <input
          className={`input ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
          type="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="label">
          <Phone size={13} className="inline mr-1.5" />Teléfono
          <span className="text-slate-600 ml-1">(opcional)</span>
        </label>
        <input
          className="input"
          type="tel"
          placeholder="+57 300 000 0000"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
      </div>

      <div>
        <label className="label">
          <MessageSquare size={13} className="inline mr-1.5" />Notas adicionales
          <span className="text-slate-600 ml-1">(opcional)</span>
        </label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="¿Algo que debamos saber?"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Confirmando...
          </>
        ) : (
          '✓ Confirmar cita'
        )}
      </button>
    </form>
  );
}
