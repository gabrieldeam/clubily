// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // se quiser mandar cookies (JWT via cookie) nas requisições:
  withCredentials: true,
});

export default api;
