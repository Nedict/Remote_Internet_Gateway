# RIG — Phase 2 foundation

RIG is an installable, mobile-first web app with a staged backend foundation. The current Phase 2 work adds the PostgreSQL/Drizzle access layer, Better Auth email/password endpoints, scoped profile and gateway reads, a readiness probe, and a transactional SQL migration runner.

## Run locally

Requires Node.js 20.9 or newer and PostgreSQL.

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL to a database you control and generate a unique BETTER_AUTH_SECRET.
npm run db:migrate
npm run dev
```

Generate a secret with `openssl rand -base64 32`. Visit `/login` to create an account or sign in. The dashboard still contains clearly marked demo gateway and connection state; it does not create a VPN tunnel.

## API

- `GET /api/v1/health` — process liveness only.
- `GET /api/v1/ready` — checks PostgreSQL connectivity and returns 503 when unavailable.
- Better Auth handler: `/api/auth/*` (email/password; configured via `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `DATABASE_URL`).
- `GET /api/v1/profile` — authenticated user and lazily initialized profile.
- `GET /api/v1/gateways` — authenticated gateways where the user has membership; never accepts a user ID from the caller.

## Database

SQL migrations in `db/migrations` are applied in filename order by `npm run db:migrate`. Applied migration names are stored in `rig_schema_migrations`; migrations run transactionally and should be immutable once applied. Back up the database before applying schema changes.

## Important limitations

This is an early development integration, not a production-ready public auth service. Before launch, configure HTTPS and a real trusted origin, email verification and password-reset delivery, rate limiting, CSRF/origin policy, monitoring, backups, and security tests. Do not deploy with example credentials. Gateway pairing, device credential enrollment, connection control, billing, and notifications are not yet active. UI sample data is not live telemetry.
