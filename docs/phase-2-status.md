# Phase 2 implementation notes

## Implemented

- PostgreSQL connection pool and typed Drizzle definitions for Better Auth identity tables, profile, gateways, and gateway memberships.
- Better Auth email/password handler under `/api/auth/*`, backed by PostgreSQL.
- Authenticated `GET /api/v1/profile` and membership-scoped `GET /api/v1/gateways`.
- PostgreSQL readiness endpoint at `/api/v1/ready`.
- Transactional migration runner that applies the existing Phase 1 SQL migration and records applied filenames.

## Next

1. Run install/build/lint and migration integration tests against disposable PostgreSQL.
2. Add verified-email and password-reset email delivery, rate limiting, and auth abuse protections.
3. Add profile update validation and gateway/device API tests, especially cross-account denial.
4. Define trusted gateway enrollment protocol before pairing or issuing device credentials.
5. Implement connection orchestration only after the control plane and platform client constraints are defined.
6. Add signed/idempotent billing webhooks and notification delivery once providers are selected.

No endpoint should trust user IDs, roles, connection state, or subscription status supplied by the browser.
