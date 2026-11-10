# Formbar Server Integration

The client is a browser frontend for a separate Formbar.js server. The server must provide both the HTTP API and Socket.IO endpoint expected by the client.

## Configure the client

Build the client with the public Formbar server origin:

```dotenv
VITE_FORMBAR_API_URL=https://api.example.com
VITE_FORMBAR_CLIENT_URL=https://formbar.example.com
```

Do not include `/api/v1` in `VITE_FORMBAR_API_URL`; the client constructs HTTP paths such as `/api/v1/auth/login`. The same base origin is used to establish the Socket.IO connection.

## Configure the server

Configure the Formbar server to:

1. Listen on an address reachable by the Nginx host or browser clients.
2. Expose the `/api/v1` HTTP routes.
3. Expose the Socket.IO endpoint at the server origin.
4. Allow the deployed client origin, for example `https://formbar.example.com`, in HTTP CORS and Socket.IO CORS settings.
5. Trust the reverse proxy when deployed behind Nginx so forwarded HTTPS and client IP information are handled correctly.
6. Configure OAuth providers, if used, with the exact client callback/redirect origins required by the server.

Use the Formbar.js server's own configuration documentation for the exact variable names and authentication/database setup. This repository cannot replace server-side configuration.

## Authentication flow

The client logs in through the HTTP API, stores the returned client tokens locally, refreshes access tokens, and then connects Socket.IO with an authorization header. A successful HTTP login with a failed socket connection usually indicates an origin, proxy, TLS, or Socket.IO configuration problem.

## Cross-origin deployment

If the UI and API use different origins:

- The API must allow the UI origin exactly; avoid a wildcard origin when credentials or authenticated sockets are involved.
- Allow the methods and headers required by the server's authentication and API routes.
- Ensure the API's TLS certificate is valid in every browser that uses the client.
- Permit WebSocket upgrade traffic through firewalls and reverse proxies.

If the UI and API share an origin through Nginx, the browser does not need cross-origin API access, but Socket.IO upgrade forwarding is still required.

## Smoke test

After deployment:

1. Open the client in a private browser window.
2. Confirm the browser can load the generated JavaScript and CSS.
3. Log in or start a guest session.
4. In browser developer tools, verify `/api/v1/...` requests succeed.
5. Verify the Socket.IO connection reaches `connected` and class updates appear.
6. Open a deep route directly, refresh it, and confirm Nginx returns the client instead of a 404.

### Next -> [Troubleshooting](Troubleshooting)