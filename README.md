# <img src="https://github.com/csmith1188/Formbar.ts-client/blob/main/public/img/FormbarLogo-Circle.png?raw=true" height=36> Formbar.ts-Client

Formbar.js is a classroom polling and management system built with Node.js.

This repository houses the official app used to interface with Formbar.

## Quick Start
### Prerequisites
-   Node.js 20.19+
-   npm or yarn

### Installation
```bash
git clone https://github.com/csmith1188/Formbar.ts-client.git
cd Formbar.ts-client
npm install
```

### Setup
- Copy or rename the `.env-template` file to `.env`
- Input your Formbar API URL as `VITE_FORMBAR_API_URL`
  - *<sub>[Need the server for your API?](https://github.com/csmith1188/Formbar.js)</sub>*
- Input your client address as `VITE_FORMBAR_CLIENT_URL`
  - Ex. `https://127.0.0.1:5173` or `https://formbar.com`

## Project Structure
- `src/main.tsx` is the client entry point.
- `src/pages/` contains route-level screens and top-level app pages.
- `src/components/` holds reusable UI pieces, including control panel modules under `src/components/ControlPanel/`.
- `src/api/` contains API wrappers grouped by backend domain.
- `src/utils/` contains shared helpers, socket setup, and logging utilities.
- `src/themes/` contains theme configuration.
- `public/` contains static assets and logos.

## Common Workflows
- Start local development with `npm run dev`.
- Run the app on the network for device testing with `npx vite --host`.
- Check formatting and code quality with `npm run lint`.
- Create a production build with `npm run build`.
- Use `./updater.sh` when you want the interactive fetch, build, and sync workflow.

### Testing
```bash
# Development - Local Testing
npm run dev

# Development - Network Testing
npx vite --host
```

---

## Building

### Generating a Build

```bash
# Strict Build (will crash on warnings, such as unused imports)
npm run build

# Development Build (ignores warnings)
npx vite build
```

This will produce a full build into the `dist/` folder.

## Using `nginx` to serve your build

### Prerequisites
- nginx 1.18.0+
- rsync (or alternative)

Below is a base config file used to serve your newly-built Formbar client.


```nginx
server {
    # Your server name - ex. formbar.com
    server_name [SERVER_NAME];

    # Built files directory
    # Can be changed, but this is recommended
    root /var/www/formbar;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

This config assumes you are both on a version of **Linux** and already have **nginx** installed.

If you are on Windows, you will need to change the directory you are reading from in the **nginx** config, along with another way of syncing files to the read directory.

In the project root, there is `updater.sh`, an interactive script for updating, building, and deploying the client.

### Usage
```bash
./updater.sh [options]
```

### Options
| Argument | Description |
|----------|-------------|
| `--no-fetch` | Skip fetching/pulling from GitHub |
| `--no-install` | Skip `npm install` |
| `--no-build` | Skip the build step entirely |
| `--full` | Fully automated: fetch, install, strict build, and sync |
| `--full-dev` | Fully automated: fetch, install, development build, and sync |
| `--sync-dir <path>` | Specify custom directory for syncing (default: `/var/www/formbar`) |

### Interactive Mode
When run without `--full` or `--full-dev`, the script presents a menu:
1. **Build** - Strict production build (`npm run build`)
2. **Build (Development)** - Development build (`npx vite build`)
3. **Test Locally** - Run dev server (`npm run dev`)
4. **Test Over LAN** - Run dev server with network access (`npm run dev -- --host`)

After building, you'll be prompted to sync `dist/` to your sync directory (default: `/var/www/formbar`).

### Examples
```bash
# Full automated build and sync to default directory
./updater.sh --full

# Full automated build with custom sync directory
./updater.sh --full --sync-dir /custom/path

# Development build with custom directory, skip fetch
./updater.sh --full-dev --no-fetch --sync-dir ~/my-formbar

# Interactive mode with custom sync directory  
./updater.sh --sync-dir /var/www/formbar-staging
```

### Manual Build & Sync
To manually build and sync folders:
```bash 
git fetch && git pull
npm run build      # Strict Build
# or
npx vite build     # Development Build

rsync -av dist/ /var/www/formbar  # Or your custom directory
``` 

This is built to work in conjunction with [**Formbar.js**](https://github.com/csmith1188/Formbar.js).
