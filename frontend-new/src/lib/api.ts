const rawUrl = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
