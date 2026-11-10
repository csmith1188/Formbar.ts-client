# <img src="https://github.com/csmith1188/Formbar.ts-client/blob/main/public/img/FormbarLogo-Circle.png?raw=true" height="36" alt="Formbar logo"> Formbar.ts-client

The official React and TypeScript web client for [Formbar.js](https://github.com/csmith1188/Formbar.js), a classroom polling and management system.

## Documentation

The [project wiki](https://github.com/csmith1188/Formbar.ts-client/wiki) contains the complete documentation:

- [Getting Started](https://github.com/csmith1188/Formbar.ts-client/wiki/Getting-Started) - prerequisites, installation, configuration, and local development.
- [Configuration](https://github.com/csmith1188/Formbar.ts-client/wiki/Configuration) - build-time environment variables and API URL behavior.
- [Project Structure](https://github.com/csmith1188/Formbar.ts-client/wiki/Project-Structure) - an in-depth guide to the repository layout.
- [Building and Deployment](https://github.com/csmith1188/Formbar.ts-client/wiki/Building-and-Deployment) - production builds, syncing, and PM2.
- [Nginx Hosting](https://github.com/csmith1188/Formbar.ts-client/wiki/Nginx-Hosting) - SPA hosting, HTTPS, caching, and reverse proxy setup.
- [Formbar Server Integration](https://github.com/csmith1188/Formbar.ts-client/wiki/Formbar-Server-Integration) - HTTP API, Socket.IO, CORS, and authentication integration.
- [Troubleshooting](https://github.com/csmith1188/Formbar.ts-client/wiki/Troubleshooting) - common development and deployment issues.

## Quick start

```bash
git clone https://github.com/csmith1188/Formbar.ts-client.git
cd Formbar.ts-client
npm install
copy .env-template .env # Windows
# cp .env-template .env  # Linux/macOS
npm run dev
```

Set `VITE_FORMBAR_API_URL`, `VITE_FORMBAR_CLIENT_URL`, and `VITE_ENCRYPTION_KEY` in `.env` before starting the application. See [Configuration](https://github.com/csmith1188/Formbar.ts-client/wiki/Configuration) for details.

## License

See the repository license and the [Formbar.js server project](https://github.com/csmith1188/Formbar.js) for the corresponding backend.
