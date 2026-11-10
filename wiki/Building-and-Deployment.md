# Building and Deployment

## Production build

From the repository root:

```bash
npm install
npm run build
```

`npm run build` runs the TypeScript project build and then Vite. Successful output is in `dist/`. Publish the contents of `dist/`, not the repository source tree.

If a deployment requires a Vite bundle without the TypeScript check, use:

```bash
npx vite build
```

This is useful for diagnosing whether a TypeScript check is the only blocker, but `npm run build` is the recommended release command.

## Copy the build to a web root

Example Linux deployment:

```bash
sudo mkdir -p /var/www/formbar
sudo rsync -av --delete dist/ /var/www/formbar/
sudo chown -R www-data:www-data /var/www/formbar
```

The web server user needs read and directory-traverse permissions. Keep the repository outside the public web root when possible.

## Updating an existing deployment

```bash
git pull --ff-only
npm install
npm run build
sudo rsync -av --delete dist/ /var/www/formbar/
sudo nginx -t
sudo systemctl reload nginx
```

`rsync --delete` removes files that no longer exist in the new build. Confirm the destination before running it.

## Automated helper

`updater.sh` can fetch, install, build, and sync on Linux systems with Bash and `rsync`:

```bash
./updater.sh --full --sync-dir /var/www/formbar
```

Use `--no-fetch`, `--no-install`, `--no-build`, or `--full-dev` when appropriate. Review the script before using it in production, and run it as a user that has only the deployment permissions it needs.

## Optional PM2 static hosting

The repository includes `ecosystem.config.cjs` for serving `dist/` with PM2:

```bash
npm install --global pm2 serve
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Nginx is still recommended as the public TLS-terminating reverse proxy. PM2 is an alternative static file server, not a replacement for the Formbar API server.

### Next -> [Nginx Hosting](Nginx-Hosting)
