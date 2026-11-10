# Formbar.ts-client Wiki

This wiki documents how to configure, build, and deploy the Formbar web client.

## Documentation

- [Getting Started](Getting-Started.md) - install dependencies and run the client locally.
- [Configuration](Configuration.md) - configure the API URL, client URL, and build-time environment.
- [Project Structure](Project-Structure.md) - understand the repository layout and where to make changes.
- [Building and Deployment](Building-and-Deployment.md) - create and publish a production build.
- [Nginx Hosting](Nginx-Hosting.md) - serve the SPA with Nginx, HTTPS, and client-side routing.
- [Formbar Server Integration](Formbar-Server-Integration.md) - connect the client to a Formbar.js server.
- [Troubleshooting](Troubleshooting.md) - diagnose common build, routing, authentication, and connection problems.

## Deployment model

The client is a static Vite application:

1. Vite reads `VITE_*` variables and produces files in `dist/`.
2. A web server such as Nginx serves `dist/`.
3. The browser sends HTTP requests and Socket.IO traffic directly to the configured Formbar server.

The client build does not include or run the Formbar server. Deploy the server separately and make its API and Socket.IO endpoint reachable from users' browsers.


### Next -> [Getting Started](Getting-Started.md)