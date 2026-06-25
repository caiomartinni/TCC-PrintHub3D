import axios from 'axios';

// Em produção (Vercel), o frontend e o backend ficam em domínios diferentes,
// então usamos VITE_API_URL (configurada no painel da Vercel) apontando para
// a URL pública do backend. Em dev, sem essa variável, cai no proxy do Vite (/api).
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('printhub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('printhub_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          localStorage.setItem('printhub_token', data.data.token);
          localStorage.setItem('printhub_refresh', data.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.data.token}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem('printhub_token');
          localStorage.removeItem('printhub_refresh');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
