# Configuration

## Environment variables

Create a `.env` file in the repository root before running `npm run dev` or `npm run build`.

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_FORMBAR_API_URL` | Yes | `https://api.example.com` | Base URL for Formbar HTTP API and Socket.IO connections. Do not add `/api/v1`; the client adds that path for HTTP requests. |
| `VITE_FORMBAR_CLIENT_URL` | Recommended | `https://formbar.example.com` | Public client URL used when the server creates links and OAuth redirect origins. |
| `VITE_ENCRYPTION_KEY` | Yes for a deployment | `use-a-long-random-value` | Client-side token-storage configuration. Use a deployment-specific value and never commit `.env`. |

The API URL may include a non-default port, for example `https://formbar.example.com:8443`. Keep the protocol and origin consistent with the server's public endpoint.

## URL behavior

For an API URL of `https://api.example.com`, the client requests:

- HTTP API: `https://api.example.com/api/v1/...`
- Socket.IO: `https://api.example.com`

The client uses the browser origin for the deployed UI, so the API server must allow that origin. If the UI and API share one origin, a relative deployment is also possible by setting `VITE_FORMBAR_API_URL` to the public origin used by the server.

## Build-time configuration

Vite replaces environment variables while building. Changing `.env` on a server after `dist/` has been built does not change the running client. Rebuild and republish the client whenever an environment value changes.

Inspect the generated bundle and deployment logs carefully; never print secret values while troubleshooting.

### Next -> [Project Structure](Project-Structure.md)
