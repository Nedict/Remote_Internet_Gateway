# Gateway authorization and ownership hardening

- Gateway rename and removal are restricted server-side to the `owner` membership role. UI visibility is not treated as authorization.
- Owners can revoke a pending setup code. Revocation is scoped to the gateway and enrollment ID.
- The browser-based claim endpoint is disabled. A user session plus a setup code does not establish hardware identity; the endpoint does not consume codes or mark gateways online.
- The dashboard calls out the pending hardware-authentication limitation and shows a setup code only in the creation response/UI state.

## Remaining before hardware activation

Implement machine identity provisioning, securely authenticate gateway requests, atomically consume enrollment codes as part of a device credential exchange, and add attempt limits/audit records. Do not mark a gateway online until it presents a trusted device credential.
