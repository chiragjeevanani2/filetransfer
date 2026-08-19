// In development (no VITE_API_URL set):
//   API_BASE = ''  → relative URLs work via Vite proxy
//   WS_URL connects directly to the backend on port 3001
//
// In production (Vercel):
//   VITE_API_URL = https://your-backend.onrender.com
//   WS_URL = wss://your-backend.onrender.com

export const API_BASE = import.meta.env.VITE_API_URL || ''

export const WS_URL = API_BASE
  ? API_BASE.replace(/^http/, 'ws')
  : `ws://${window.location.hostname}:3001`
