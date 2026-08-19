// In development: VITE_API_URL is not set, so API_BASE is ''
// and Vite's dev-server proxy forwards /api/* → localhost:3001
//
// In production (Vercel): set VITE_API_URL to your Render backend URL,
// e.g. https://localdrop-backend.onrender.com
export const API_BASE = import.meta.env.VITE_API_URL || ''
