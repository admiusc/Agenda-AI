import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Lock } from 'lucide-react';
import api from '../utils/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/admin/login', { password });
      localStorage.setItem('adminToken', data.token);
      navigate('/admin');
    } catch {
      setError('Contraseña incorrecta');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AgendaAI</h1>
          <p className="text-slate-400 text-sm mt-1">Panel de administración</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <Lock size={13} className="inline mr-1.5" />Contraseña
              </label>
              <input
                type="password"
                className={`input ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Entrando...</>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          <a href="/" className="hover:text-slate-400 transition-colors">← Volver al inicio</a>
        </p>
      </div>
    </div>
  );
}
