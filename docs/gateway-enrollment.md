# Gateway enrollment implementation

The MVP setup-code flow is implemented in API form:

- `POST /api/v1/gateways/enroll` creates a pending gateway, owner membership, and 15-minute setup code.
- Codes are generated with `node:crypto` and only their SHA-256 hash is stored.
- Gateway creation and owner membership are issued as one SQL transaction.
- Setup codes use an unambiguous alphabet and are returned once; they are not persisted as plaintext.

Before accepting a code from a gateway device, add a separate machine-authenticated claim endpoint, revoke-on-consumption logic, and per-address/per-account attempt throttling. The enrollment UI must remain in pending state until a gateway is verified by trusted device hardware.
