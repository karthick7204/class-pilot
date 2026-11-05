/**
 * Base API URL for backend requests.
 * In local development, defaults to '' (proxied by Vite to http://localhost:5055).
 * In production (e.g. deployed to Vercel/Render), set VITE_API_URL in your hosting dashboard.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

