# Remote Internet Gateway

A consumer-facing dashboard prototype for a future home internet gateway. The current app is a **frontend-only demo**: it has interactive connection controls, route selection, gateway pairing UI, and preferences, but it does not establish a VPN tunnel or communicate with a server.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- CSS (no UI or styling framework required)

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To check the production build:

```bash
npm run build
npm start
```

## Prototype interactions

- Connect and disconnect (simulated state only)
- Select full-internet or home-network-only mode
- View gateway status and session timer
- Open the gateway pairing dialog
- Toggle the network-lock preference

No traffic is routed, no pairing code is sent or saved, and no user data is collected. The backend, authentication, and actual VPN client are not implemented yet.
