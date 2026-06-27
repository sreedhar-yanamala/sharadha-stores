/**
 * Centralized API configuration.
 * Set VITE_API_URL in your .env file to point to a different backend.
 * e.g., VITE_API_URL=https://api.mysite.com
 *
 * For local development this defaults to http://localhost:5000
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
