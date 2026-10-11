<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# MediFlow ET frontend

React/Vite frontend for MediFlow ET. Clinic data and authentication are served by
the NestJS backend.

## Run locally

Prerequisite: Node.js.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the
   backend API base, including its configured prefix (for example,
   `http://localhost:3000/api/v1`).
3. Start the frontend using `npm run dev`. Vite serves it at
   `http://localhost:5173`; the backend can keep its default port `3000`.

The frontend environment contains only public configuration. Never put API
secrets, signing keys, or database credentials in a `VITE_*` variable.
