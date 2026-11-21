# Full-stack dashboard progress

The account dashboard is now available at `/dashboard` for signed-in users and redirects guests to `/login`. It fetches the authenticated profile and membership-scoped gateways from the RIG API, supports saving a display name and IANA timezone through the authenticated profile endpoint, and refreshes backend data on demand.

The `PATCH /api/v1/profile` endpoint only updates the profile belonging to the current Better Auth session. It validates the JSON shape, display name length, and timezone, and rejects extra fields. No account/user ID is accepted from the browser.

Gateway enrollment and VPN connectivity remain intentionally deferred. The UI explains the absence of gateway pairing; no setup codes, device credentials, or tunnel state are fabricated. Next backend work should include testing the end-to-end account/dashboard flow, email verification/password reset, and secure gateway enrollment design before enabling pairing.
