import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Creates an axios instance that attaches a bearer token from localStorage
// (a different key for staff vs. customer, since both could be logged in
// in the same browser at once) and unwraps `response.data`, so every
// caller gets the parsed JSON body directly instead of the full axios
// response object.
export function createHttpClient(tokenKey) {
  const instance = axios.create({ baseURL: API_BASE_URL });

  instance.interceptors.request.use(config => {
    const token = localStorage.getItem(tokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    res => res.data,
    err => {
      const message = err.response?.data?.message || err.message || "Noma'lum xatolik yuz berdi";
      const normalized = new Error(message);
      normalized.status = err.response?.status;
      normalized.details = err.response?.data?.details;
      return Promise.reject(normalized);
    }
  );

  return instance;
}
