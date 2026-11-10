# Nginx Hosting

This configuration serves the Vite SPA, supports client-side routes, and caches hashed static assets.

## Install and prepare

On Debian or Ubuntu:

```bash
sudo apt update
sudo apt install nginx
sudo mkdir -p /var/www/formbar
sudo rsync -av --delete dist/ /var/www/formbar/
```

## HTTP server block

Create `/etc/nginx/sites-available/formbar`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name formbar.example.com;

    root /var/www/formbar;
    index index.html;

    # React Router routes must fall back to the SPA entry point.
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Enable and validate it:

```bash
sudo ln -s /etc/nginx/sites-available/formbar /etc/nginx/sites-enabled/formbar
sudo nginx -t
sudo systemctl reload nginx
```

Remove or disable the default site if it claims the same hostname.

## HTTPS

Point DNS for `formbar.example.com` at the Nginx host, allow ports 80 and 443 through the firewall, and obtain a certificate. With Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d formbar.example.com
sudo certbot renew --dry-run
```

Build the client with:

```dotenv
VITE_FORMBAR_CLIENT_URL=https://formbar.example.com
VITE_FORMBAR_API_URL=https://api.example.com
```

Do not serve an HTTPS client that connects to an HTTP API; browsers block that mixed-content connection.

## Reverse proxying the API on the same hostname

If the Formbar server is listening on `127.0.0.1:420`, the API can be exposed under the same public origin:

```nginx
server {
    listen 443 ssl;
    server_name formbar.example.com;

    root /var/www/formbar;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:420;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:420;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

When using this same-origin arrangement, build with `VITE_FORMBAR_API_URL=https://formbar.example.com`. Verify the Formbar server's own proxy/trust settings for the deployment.

### Next -> [Formbar Server Integration](Formbar-Server-Integration.md)
