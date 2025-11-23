import axios from 'axios';

const djangoApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Interceptor para añadir el token de autenticación a cada solicitud
djangoApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default djangoApi;