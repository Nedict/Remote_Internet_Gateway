# Gateway machine identity and enrollment

Enrollment now uses Ed25519 proof of possession. The gateway must generate its private key locally and never transmit it. The public key is registered with the gateway identity.

## Bootstrap exchange

1. An authenticated owner creates an enrollment; the code expires after 15 minutes and is shown once.
2. The gateway calls `POST /api/v1/gateways/enroll/challenge` with `{ "code": "XXXX-XXXX-XXXX" }`. The service returns a 32-byte random nonce and enrollment ID, valid for five minutes. Challenge issuance is capped at five attempts per setup code.
3. The gateway signs UTF-8 bytes of `RIG_GATEWAY_ENROLLMENT_V1\\n<enrollmentId>\\n<nonce>` using Ed25519.
4. It calls `POST /api/v1/gateways/claim` with `{ "code", "enrollmentId", "nonce", "publicKey", "signature", "deviceName" }`. `publicKey` is PEM; `signature` is base64url.
5. The server verifies the signature and, in one DB transaction, locks the still-pending enrollment, validates code and challenge hashes/expiry, inserts the device identity, consumes the setup code, and marks the gateway online. The code cannot be replayed.
6. The server returns a random 256-bit bearer credential once. The device stores this securely and uses `POST /api/v1/gateways/heartbeat` with `Authorization: Bearer <credential>`. Only the credential hash is stored; heartbeat updates the registered identity and gateway.

The gateway private key must remain on the device. Protect the returned credential as a secret. The heartbeat is a machine-authentication/status facility only; this implementation does not provide VPN tunneling or data-plane access. Apply migrations with `npm run db:migrate` before deploying these endpoints. Do not enable production device enrollment until an operational rate limit per source and monitoring are configured at the edge.
