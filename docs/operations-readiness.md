# RIG operational readiness (excluding VPN data plane)

## Included in this stage

- Authenticated device inventory, owner/admin rename and revoke, database-backed request throttles, device enrollment audit entries, and user-scoped notifications API.
- Device revocation is immediate: revoked identities cannot authenticate heartbeats.
- HTTP APIs return `429` with a retry hint when they exceed configured request thresholds.

## Deployment prerequisites / limits

1. Apply migrations with `DATABASE_URL` and `npm run db:migrate` before deploying application code.
2. Configure the edge proxy to overwrite `CF-Connecting-IP` or `X-Real-IP`; these headers must not be accepted directly from arbitrary clients. The application falls back to one shared `unknown` source key, which can throttle all callers if proxy IP forwarding is absent.
3. Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 characters), and `BETTER_AUTH_URL`; use TLS and a managed secret store.
4. Email-based verification and password recovery require a configured mail provider and delivery callback. They are intentionally not represented as working features until delivery is configured.
5. Billing requires a chosen provider, verified webhook signatures, and product/price configuration. No fake checkout or subscription state is exposed.
6. Configure backups/PITR, monitoring, alerting, log retention, and a production deployment pipeline before public launch.
7. Run lint, build, and the database integration checks in CI against a disposable migrated PostgreSQL instance. This repository does not yet include a provisioned CI/database test environment, so endpoint behavior must be validated before launch.

VPN tunneling and data-plane routing remain out of scope and disabled.
