/**
 * Centralized API configuration.
 * In development, this defaults to '/api' (which is proxied by Vite).
 * In production, you can set VITE_API_BASE_URL to your deployed backend.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
