# Phase 1 backend architecture

## Boundary

The Next.js app is the customer-facing PWA and the first API host. `app/api/v1` is reserved for versioned product endpoints. Authentication is planned with Better Auth and PostgreSQL; the current `/api/v1/health` route is only a process liveness check. It intentionally does not report database readiness or imply that authentication is active.

Keep server credentials in server-only environment variables. Do not expose secrets through `NEXT_PUBLIC_*`. The mobile UI should call a typed API client rather than reading database records or embedding provider logic.

## Data domains

- **Identity:** Better Auth user, session, account, and verification records; RIG profile preferences.
- **Access:** gateway memberships with owner/admin/operator/viewer roles. Every gateway/device/connection read or mutation must enforce membership and role authorization on the server.
- **Devices:** gateway records and per-client device identities. Revoke identities server-side; never persist private tunnel keys in the database.
- **Connections:** requested/active/ended/failed session lifecycle and route mode. This is bookkeeping only until a trusted gateway control plane exists.
- **Customer operations:** notifications, subscription state, and append-only audit events. Payment-provider webhooks must be verified before changing subscription state.

## Initial API shape (planned, not implemented)

- `GET /api/v1/health` — implemented process liveness only.
- `GET /api/v1/profile` — authenticated profile.
- `GET /api/v1/gateways` — gateways visible to the authenticated user.
- `POST /api/v1/gateways/pairings` — initiate a short-lived, single-use pairing flow.
- `GET /api/v1/gateways/{gatewayId}/devices` — authorized device list.
- `POST /api/v1/connections` / `DELETE /api/v1/connections/{connectionId}` — request/end a connection; requires gateway authorization and idempotency.
- `GET /api/v1/notifications` and `GET /api/v1/subscription` — account-scoped customer data.

All endpoints other than liveness require authentication, validation, authorization, rate limits, and structured errors before release. Never trust a user ID, role, gateway state, or subscription status supplied by the client.

## Build sequence

1. Select the PostgreSQL host and migration runner; verify migration/restore workflow.
2. Add Better Auth with secure production cookie/session settings and account verification policy.
3. Add database access, migrations in CI, and integration tests using a disposable PostgreSQL database.
4. Implement profile and gateway APIs with ownership/role enforcement and audit events.
5. Add pairing and connection orchestration only after the gateway trust/control-plane protocol is defined.
6. Integrate notifications and subscription provider after choosing providers and webhook policy.

## Security checklist before production

- TLS, strict origin/CSRF policy, secure cookies, email verification, password reset and session revocation.
- Least privilege and per-resource authorization for every request; test cross-account access denial.
- Rate-limit login, pairing, connection and verification operations.
- Hash one-time pairing/device credentials; store no private tunnel keys or raw payment data.
- Verify webhook signatures, make webhook processing idempotent, and audit privileged actions.
- Add database backups, retention policy, secret rotation, readiness/metrics, and incident logging.
