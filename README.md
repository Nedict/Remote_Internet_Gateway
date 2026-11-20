# RIG — Remote Internet Gateway

A mobile-first dashboard prototype for the future RIG home gateway app. It previews the customer experience for connection controls, gateway management, activity, and preferences.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Check the production build with:

```bash
npm run build
npm start
```

## Preview behavior

- Connect/disconnect state and session timer (simulated)
- Select full-internet or home-devices-only mode
- Gateway overview and pairing dialog
- Activity and network-lock preference screens
- Responsive mobile bottom navigation and desktop sidebar

This is a visual prototype only. It does not authenticate users, create a VPN tunnel, send pairing codes, or route traffic. Gateway and network readings shown are sample UI data, not live measurements.
