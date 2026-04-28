import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Inyectar token admin en cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers['x-admin-token'] = token;
  return config;
});

export default api;
