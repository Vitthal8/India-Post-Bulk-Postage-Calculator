# Node.js Hosting Guide

This guide explains what hosting means, where application data lives, and how to run this project on a Windows PC or an Ubuntu server.

## 1. The basic hosting picture

When someone opens `https://example.com`, the request normally travels like this:

1. **Domain name**: DNS converts `example.com` into a server IP address.
2. **Firewall**: The server accepts web traffic, normally on ports 80 (HTTP) and 443 (HTTPS).
3. **Reverse proxy**: Nginx or a hosting platform receives the public request.
4. **Node.js process**: The proxy forwards application requests to Node, for example on private port 3002.
5. **Application**:
   - React/Vite serves the browser interface.
   - Express handles `/api/...` requests.
   - Node reads or writes server-side files and talks to external services.
6. **Storage**: Data is stored in browser storage, server files, a database, or object storage depending on the application.

The browser does not automatically store data on your server. A browser can store data in cookies, `localStorage`, IndexedDB, or its cache. Server data must be explicitly sent to an API and saved by the backend.

## 2. How this project works

This repository is a **single Node.js process** containing:

- A React frontend built by Vite.
- An Express server in `server.ts`.
- API routes under `/api/indiapost/...`.
- A production static-file server for the generated `dist` directory.
- A scraper/cache module under `server/indiaPostScraper.ts`.

Development:

```text
Browser -> Express + Vite middleware -> React source and /api routes
```

Production:

```text
Browser -> Nginx/host -> Node/Express :3002 -> dist/index.html and /api routes
```

Build and run:

```powershell
npm install
npm run build
$env:NODE_ENV="production"
$env:PORT=3002
npm start
```

The server uses `PORT` when provided and otherwise defaults to `3002`. In production it serves `dist`; it is not enough to upload only `dist` because the live API requires the Node/Express process.

## 3. Where data is stored in this project

### Browser-only data

Saved jobs, the active job, and the calculator mode are stored in the browser's `localStorage`. This means:

- Chrome and Edge can have different saved jobs.
- A phone and a laptop do not share saved jobs.
- Clearing site data deletes them.
- Incognito/private browsing is temporary.
- Opening the site from a different domain can show an empty state.

These are not multi-user server records.

### Server-side data

The scraper uses:

```text
<application working directory>\rates_cache_v3.json
```

The exact path is based on Node's current working directory (`process.cwd()`), not necessarily the source-file directory. The file contains cached rates, PIN information, exceptions, and sync history. It is local disk storage:

- It belongs to the machine/container running Node.
- It is shared by requests handled by that process.
- It can be lost when a managed host redeploys or replaces an ephemeral container.
- It is not a database and has no built-in multi-user permissions or concurrent-write protection.

The app's Live Portal Inspector can export this cache. Back it up before updates and before moving hosts.

### Data that is not stored by this app

This project does not currently have a user account system or database such as PostgreSQL, MySQL, or MongoDB. If users must share saved jobs, add an authenticated API and a database. If uploaded files or large backups must survive server replacement, use object storage or a persistent disk.

## 4. Windows local-PC hosting

This is suitable for development, a private office LAN, or temporary internal use. It is not automatically a secure public production host.

### Install prerequisites

Install Node.js 20 or newer and confirm:

```powershell
node --version
npm --version
```

Clone or copy the repository, then open PowerShell in its root:

```powershell
cd D:\ProjectsWeb\India-Post-Bulk-Postage-Calculator
npm install
npm run lint
```

### Run for local use

```powershell
$env:PORT=3002
npm run dev
```

Open `http://localhost:3002`. Check the backend with `http://localhost:3002/api/health`.

### Allow another computer on the same LAN

The server listens on `0.0.0.0`, so find the PC's private IPv4 address:

```powershell
Get-NetIPAddress -AddressFamily IPv4
```

Allow the port only on the Private Windows Firewall profile (run PowerShell as Administrator):

```powershell
New-NetFirewallRule -DisplayName "India Post Calculator 3002" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow -Profile Private
```

Other devices can use `http://YOUR-LAN-IP:3002`. Do not expose port 3002 directly to the whole internet unless you understand firewall, authentication, patching, and HTTPS requirements.

### Run the production build on Windows

```powershell
npm run build
$env:NODE_ENV="production"
$env:PORT=3002
npm start
```

Keep the terminal open. Closing it stops Node. For automatic restart on a Windows PC, use a Windows service manager or a process manager such as PM2:

```powershell
npm install --global pm2
pm2 start --name india-post-calculator "npx tsx server.ts"
pm2 save
pm2 status
pm2 logs india-post-calculator
```

For a public domain on Windows, put IIS, Caddy, or Nginx in front of Node and terminate HTTPS there. Do not expose the Node port as the primary public endpoint.

## 5. Ubuntu VPS hosting

The following is a standard production pattern for an Ubuntu VPS. Commands requiring `sudo` need an administrator account.

### Create the server and DNS

1. Create an Ubuntu 22.04/24.04 VPS.
2. Point an `A` record such as `app.example.com` to the VPS public IPv4 address.
3. Keep the provider's SSH access available.
4. Allow SSH (22), HTTP (80), and HTTPS (443) in the provider firewall. Do not open 3002 publicly.

DNS changes may take time to appear. Verify from your own computer with:

```powershell
nslookup app.example.com
```

### Install system packages and Node.js

SSH into the server:

```bash
ssh your-user@app.example.com
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx ufw ca-certificates curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Use the Node major version required by the project (`20` or newer) and keep it consistent when upgrading.

### Copy and build the application

```bash
sudo mkdir -p /var/www/india-post-calculator
sudo chown -R "$USER":"$USER" /var/www/india-post-calculator
git clone https://github.com/Vitthal8/India-Post-Bulk-Postage-Calculator.git /var/www/india-post-calculator
cd /var/www/india-post-calculator
npm ci
npm run lint
npm run build
```

Do not upload a real `.env` to Git. Create it on the server if the application needs secrets:

```bash
nano /var/www/india-post-calculator/.env
chmod 600 /var/www/india-post-calculator/.env
```

Environment variables are read by Node at runtime. Never put private API keys in React source or `VITE_*` variables unless they are intentionally public; frontend variables are shipped to every browser.

### Test Node privately

```bash
cd /var/www/india-post-calculator
NODE_ENV=production PORT=3002 npm start
```

From another SSH session on the VPS:

```bash
curl http://127.0.0.1:3002/api/health
```

Stop the foreground process with `Ctrl+C` after this test.

### Keep Node running with PM2

```bash
sudo npm install --global pm2
cd /var/www/india-post-calculator
pm2 start "npx tsx server.ts" --name india-post-calculator --update-env
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` as root, then verify:

```bash
pm2 status
pm2 logs india-post-calculator
curl http://127.0.0.1:3002/api/health
```

PM2 restarts the process after a crash and can restore it after reboot. It does not replace backups, monitoring, or security updates.

### Configure Nginx as the public reverse proxy

Create `/etc/nginx/sites-available/india-post-calculator`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test it:

```bash
sudo ln -s /etc/nginx/sites-available/india-post-calculator /etc/nginx/sites-enabled/india-post-calculator
sudo nginx -t
sudo systemctl reload nginx
```

Visit `http://app.example.com`. If it fails, check `pm2 logs india-post-calculator` and `sudo tail -f /var/log/nginx/error.log`.

### Add HTTPS with Let's Encrypt

After DNS points to the VPS and HTTP works:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
sudo certbot renew --dry-run
```

Certbot updates Nginx and schedules renewal. Always use the HTTPS URL in production.

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not add an allow rule for 3002. Nginx is the only public web entry point.

## 6. Updating the Ubuntu deployment

Back up the cache first:

```bash
cd /var/www/india-post-calculator
cp rates_cache_v3.json "rates_cache_v3.json.$(date +%Y%m%d-%H%M%S).backup"
git pull --ff-only
npm ci
npm run lint
npm run build
pm2 restart india-post-calculator --update-env
curl https://app.example.com/api/health
```

If the update fails, inspect the build output and `pm2 logs`. Do not delete the old cache until the new version is confirmed.

## 7. Backups and persistence

At minimum, back up:

- `rates_cache_v3.json`.
- Any server-side `.env` values, stored securely rather than in a public repository.
- Database data, if a database is added later.
- Uploaded files or object-storage configuration, if added later.

Example local backup from the VPS:

```bash
mkdir -p ~/india-post-backups
cp /var/www/india-post-calculator/rates_cache_v3.json \
  ~/india-post-backups/rates_cache_v3-$(date +%Y%m%d-%H%M%S).json
```

This is not an off-server backup. Also copy backups to a separate private location and periodically test restoring one. For a managed host with ephemeral storage, do not rely on the local JSON file; use a managed database or persistent volume.

## 8. Choosing a hosting type

| Hosting type | Good for | Important limitation |
| --- | --- | --- |
| Windows PC | Learning, LAN, internal office | PC, internet, and terminal/service must stay available |
| Ubuntu VPS | Full control and predictable disk | You manage updates, firewall, Nginx, HTTPS, and backups |
| Render/Railway/Cloud Run | Faster deployment and managed operations | Files may be ephemeral; configure persistent storage/database |
| Vercel/Netlify static hosting | React frontend only | This project's Express API and server cache need a separate backend |

For this repository, use a Node-capable service that runs `npm run build` during deployment and `npm start` at runtime. Set `NODE_ENV=production` and `PORT` according to the host. If the host supplies its own port, do not hard-code a different public port.

## 9. Security checklist

- Use HTTPS for every public site.
- Keep Node.js, Ubuntu, npm packages, Nginx, and the host updated.
- Do not commit `.env`, API keys, session cookies, or private exports.
- Do not expose port 3002 publicly when Nginx can proxy to it locally.
- Add authentication before exposing cache import, cache clear, session-cookie, or administrative endpoints to the public internet.
- Validate request bodies and impose sensible size/rate limits before accepting untrusted traffic.
- Restrict SSH to keys where possible and disable password login only after confirming key access.
- Monitor disk space because JSON cache files and logs grow over time.
- Treat `rates_cache_v3.json` as sensitive operational data and back it up privately.

## 10. Troubleshooting

### Browser says it cannot connect

Check that Node is running, the port is correct, and the firewall allows the intended path:

```bash
pm2 status
curl http://127.0.0.1:3002/api/health
sudo systemctl status nginx
```

### Page loads but API calls fail

You may have uploaded only `dist` or opened `index.html` directly. Start the Express server and use the domain served through Nginx. The API is provided by Node, not by the static HTML file.

### Cache disappeared

The cache is a file on the server's current working directory. Check:

```bash
pwd
ls -lh rates_cache_v3.json
```

The file may have been lost during a redeploy, created in a different working directory, or restored from a different backup. Managed platforms often replace local files.

### Port already in use

Use a different local port for testing:

```powershell
$env:PORT=3003
npm start
```

On Ubuntu, inspect the process rather than starting duplicate servers:

```bash
sudo ss -ltnp | grep 3002
pm2 status
```

### Domain works but HTTPS does not

Confirm the DNS record points to the current VPS IP, port 80/443 is allowed, and `sudo nginx -t` succeeds. Then run `sudo certbot renew --dry-run`.

## 11. The simplest mental model

For a public Node.js application, remember:

```text
Domain/DNS -> HTTPS reverse proxy -> Node process -> API/business logic -> storage
```

For this app specifically:

```text
Browser localStorage: saved jobs and UI preferences
Node server file: rates_cache_v3.json
External service: India Post portal when Online mode is used
```

If data must be available to every user after a server restart, local browser storage and a local JSON file are not enough. Add a backend database and durable backups.
