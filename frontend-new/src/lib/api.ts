const rawUrl = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Token is invalid or expired
    localStorage.removeItem('access_token');
    window.location.href = '/auth';
  }
  
  return response;
}
