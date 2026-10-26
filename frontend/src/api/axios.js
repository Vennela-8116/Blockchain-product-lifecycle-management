import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only redirect if not already on /login or /register or /passport
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && !path.startsWith('/passport')) {
        localStorage.removeItem('rc_token');
        localStorage.removeItem('rc_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
