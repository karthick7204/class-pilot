/**
 * Base API URL for backend requests.
 * Configured via .env / .env.local in Next.js (NEXT_PUBLIC_API_URL).
 * In production or cross-domain, set NEXT_PUBLIC_API_URL in .env.local
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');



