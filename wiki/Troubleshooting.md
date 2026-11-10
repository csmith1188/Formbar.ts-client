# Troubleshooting

## The page loads blank or shows old code

- Confirm the latest files were copied from `dist/` to the configured web root.
- Check the browser console for JavaScript errors.
- Hard-refresh after a deployment.
- Confirm Nginx is serving the expected `index.html` and asset paths.

## Refreshing a route returns 404

The server needs SPA fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Run `sudo nginx -t` and reload Nginx after changing the configuration.

## API requests fail

- Confirm `VITE_FORMBAR_API_URL` is the public API origin and rebuild the client after changing it.
- Test the API host from the same browser/device that loads the client.
- Check browser mixed-content errors when the client uses HTTPS.
- Check the Formbar server logs and its CORS allowlist.

## Socket.IO does not connect

- Confirm the API origin is reachable and the Socket.IO endpoint is enabled.
- If using Nginx, verify `Upgrade` and `Connection` headers are forwarded.
- Check that the server allows the client origin.
- Check TLS certificates and firewall rules.

## Login works but later requests are unauthorized

Confirm the browser is receiving the server's token response and that the client and API are built with the intended environment values. Clear site storage and sign in again after changing a deployment or encryption key.

## Build errors

Run:

```bash
node --version
npm install
npm run build
```

Use the first reported TypeScript or dependency error as the starting point. Do not publish a partially generated `dist/` directory.
