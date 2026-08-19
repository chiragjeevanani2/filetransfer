# LocalDrop — Preview Run Doc

## How to reproduce uncommitted artifacts

No special env files needed for local dev. The frontend Vite config works out of the box
on localhost with a proxy to the backend on port 3001.

If `.env.local` exists in `frontend/`, copy it from the main checkout:
```
copy frontend\.env.local frontend\.env.local
```

## How to run the server

```bash
cd frontend
npm install
npm run dev
```

This starts the Vite dev server on port 5173 (default) with `--host` enabled.
The backend (port 3001) is optional for local dev — the WebSocket features
require it, but the UI renders without it.
