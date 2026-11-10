# Project Structure

This page describes the main directories and files in the Formbar.ts-client repository. The client is a Vite-powered React application written in TypeScript.

## Repository tree

```text
Formbar.ts-client/
├── public/
│   └── img/                       Static images copied without bundling
├── src/
│   ├── api/                       HTTP API wrappers for Formbar.js
│   ├── assets/					   Global Styles, Fonts, SFX, etc
│   ├── components/                Custom Formbar Components
│   ├── pages/                     Wrappers for each Formbar Page
│   ├── themes/                    Configuration for themes
│   ├── utils/                     Shared non-UI behavior
│   ├── main.tsx                   Application entry point and React providers
│   ├── pages.tsx                  Route definitions
│   ├── settings.config.ts         Settings categories and setting metadata
│   └── types.ts                   Shared TypeScript domain types
├── wiki/                          GitHub Wiki Information
├── .env-template                  Example Vite environment configuration
├── ecosystem.config.cjs           PM2 static-server configuration
├── eslint.config.js               ESLint configuration
├── index.html                     Vite HTML entry document
├── package.json                   Scripts and npm dependencies
├── tsconfig*.json                 TypeScript project configurations
├── updater.sh                     Linux build-and-sync helper
└── vite.config.ts                 Vite plugins, aliases, and dev-server settings
```

## Application layers

### Entry point and providers

[`src/main.tsx`](../src/main.tsx) creates the React root, defines shared contexts, loads saved settings, manages authentication/session state, and assembles the top-level routes. Providers in this file expose user data, class data, notifications, themes, and settings to descendant components.

### Routing and pages

[`src/pages.tsx`](../src/pages.tsx) maps URLs to page components. Files under [`src/pages/`](../src/pages/) represent complete route screens. A page should coordinate data and layout; reusable controls belong under [`src/components/`](../src/components/).

### API layer

Files under [`src/api/`](../src/api/) wrap server requests by domain. [`HTTPApi.ts`](../src/api/HTTPApi.ts) provides the shared request path, API version, authorization header, response parsing, anonymous-client handling, and error reporting. Domain modules should use this shared layer instead of duplicating fetch setup.

The realtime connection is separate from ordinary HTTP requests and is implemented in [`src/utils/socket.ts`](../src/utils/socket.ts). It connects to the same base URL configured by `VITE_FORMBAR_API_URL`.

### Components and control panel

[`src/components/`](../src/components/) contains reusable UI and feature components. The [`ControlPanel/`](../src/components/ControlPanel/) subdirectory groups the larger management interfaces, such as polls, roles, settings, dashboards, statistics, and timers. Provider components in [`providers/`](../src/components/providers/) expose cross-cutting UI services such as global messages.

### Configuration and shared types

- [`settings.config.ts`](../src/settings.config.ts) describes settings shown in the settings modal, including categories, controls, and visibility requirements.
- [`types.ts`](../src/types.ts) contains shared domain and API types.
- [`themes/ThemeConfig.ts`](../src/themes/ThemeConfig.ts) defines theme behavior and display constants.
- [`vite.config.ts`](../vite.config.ts) defines the `@` path aliases used by imports.

## Where to make common changes

| Change | Primary location |
| --- | --- |
| Add a server endpoint wrapper | `src/api/` |
| Add a route/page | `src/pages/` and `src/pages.tsx` |
| Add reusable UI | `src/components/` |
| Add a control-panel feature | `src/components/ControlPanel/` |
| Add a setting | `src/settings.config.ts`, plus `src/main.tsx` if it needs new persisted state |
| Add or update a domain type | `src/types.ts` |
| Change socket events or authentication transport | `src/utils/socket.ts` |
| Change colors, typography, or global layout | `src/themes/` or `src/assets/css/` |
| Change build aliases or dev-server behavior | `vite.config.ts` |
| Change deployment output or scripts | `package.json`, `updater.sh`, or `ecosystem.config.cjs` |

Keep server behavior in the Formbar.js repository. This client should contain browser UI, client state, API wrappers, and the transport integration required to communicate with that server.

### Next -> [Building and Deployment](Building-and-Deployment)