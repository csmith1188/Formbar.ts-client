# Getting Started

## Prerequisites

- Node.js 20.19 or newer.
- npm (included with Node.js) or another npm-compatible package manager.
- A reachable Formbar.js server for login and application data. The default development URL is `http://localhost:420`.

## Clone and install

```bash
git clone https://github.com/csmith1188/Formbar.ts-client.git
cd Formbar.ts-client
npm install
```

## Configure the development environment

Create `.env` from `.env-template`:

```dotenv
VITE_FORMBAR_API_URL=http://localhost:420
VITE_FORMBAR_CLIENT_URL=http://localhost:5173
VITE_ENCRYPTION_KEY=replace-with-a-development-key
```

`VITE_*` values are embedded into the browser bundle at build time. Do not put passwords, private keys, refresh tokens, or other secrets in this file. `VITE_ENCRYPTION_KEY` is used by the client-side token storage code and is not a substitute for server-side secret management.

Restart Vite after changing `.env`.

## Run locally

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

To test from another device on the same network:

```bash
npm run dev -- --host
```

Use the computer's LAN address from the other device. The Formbar API URL must also be reachable from that device; `localhost` refers to the device running the browser, not necessarily the development computer.

## Useful checks

```bash
npm run lint
npm run build
```

The production build is written to `dist/`.

### Next -> [Configuration](Configuration)