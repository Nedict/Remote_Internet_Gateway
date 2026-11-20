# RIG — Phase 1 foundation

RIG is being developed in three phases: (1) mobile app and backend foundation, (2) backend integration and production services, and (3) the admin portal. This repository currently contains the mobile-first web-app preview and the initial backend contract/schema foundation.

## Stack direction

- Next.js App Router for the installable web app and versioned API routes
- PostgreSQL for product data
- Better Auth for account/session authentication (integration is not enabled yet)

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `GET /api/v1/health` is a liveness endpoint and does not claim that the database or authentication provider is configured.

## Phase 1 foundation included

- PostgreSQL migration defining auth-compatible identity tables and RIG profile, gateway, membership/permission, device identity, connection session, notification, subscription, and audit-event data.
- Versioned API liveness route at `/api/v1/health`.
- `.env.example` documenting the planned server-only configuration.

## Not production-ready yet

Authentication, authorization enforcement, database connectivity, gateway pairing, VPN connectivity, billing, and notification delivery are not wired up. Do not treat sample UI state as live data or expose this preview as a production service. Apply the migration only after selecting/configuring a migration runner and PostgreSQL instance; use a new migration for future schema changes. The device schema stores a credential hash and public key only—the private device key must remain on the device.

See `docs/phase-1-architecture.md` for the staged implementation plan.
