<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# ClinicFlow frontend

React/Vite frontend for ClinicFlow. Clinic data and authentication are served by
the Express API in `../backend`.

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

## Clinic owner registration

The `/register` flow sends a registration-purpose OTP to the supplied mobile
number, then creates the administrator account and clinic through the API.
Local development uses the backend console OTP adapter, so read the API
terminal for the code. Production requires the backend OTP delivery provider
and its server-side environment configuration.
