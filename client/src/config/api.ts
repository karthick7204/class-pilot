/**
 * Base API URL for backend requests.
 * Takes the URL from process.env.API_URL with a default fallback.
 */
export const API_URL = (process.env.API_URL || 'http://localhost:3002').replace(/\/+$/, '');
export const API_BASE_URL = API_URL;




