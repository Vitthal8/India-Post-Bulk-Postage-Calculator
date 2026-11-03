# India Post Bulk Postage Calculator

India Post Bulk Postage Calculator is a React and Express application for estimating India Post postage costs. It supports bulk spreadsheet-style calculations, CSV import/export, postal-circle exploration, GST totals, printable manifests, and live India Post tariff and PIN-code lookups with cached fallback data.

## Requirements

- Node.js 20 or newer
- npm 10 or newer, or [Bun](https://bun.sh/)
- Internet access for live India Post portal lookups

## Install

Using npm:

```powershell
npm install
```

Using Bun:

```powershell
bun install
```

The repository includes `package.json` and a `bun.lock` lockfile. Use one package manager consistently for a given checkout; npm will resolve dependencies from `package.json`.

## Configure environment variables

Copy `.env.example` to `.env` if you need to configure optional integrations:

```powershell
Copy-Item .env.example .env
```

Do not commit real API keys or session cookies. The application can use the built-in tariff and cache data when live services are unavailable.

## Run locally on port 3002

The normal local workflow runs the Express server, which also hosts Vite middleware and the `/api` routes. Set `PORT=3002` because `server.ts` otherwise defaults to port 3000.

Windows PowerShell with npm:

```powershell
$env:PORT=3002
npm run dev
```

Windows PowerShell with Bun:

```powershell
$env:PORT=3002
bun run dev
```

On macOS or Linux:

```bash
PORT=3002 npm run dev
# or
PORT=3002 bun run dev
```

Open [http://localhost:3002](http://localhost:3002) in a browser. The server listens on all interfaces, so `http://127.0.0.1:3002` also works.

To confirm that the backend is running, open:

```text
http://localhost:3002/api/health
```

The `start` script is an alias for `dev`:

```powershell
$env:PORT=3002
npm start
```

## Production-style local run

Build the client first, then start the Express server in production mode:

```powershell
npm run build
$env:NODE_ENV="production"
$env:PORT=3002
npm start
```

For Bun, replace the npm commands with `bun run build` and `bun start`.

The production server serves the generated `dist` directory and keeps the same API routes. This is useful for testing the built application locally; it is not a substitute for configuring a production host, HTTPS, or process supervision.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `bun run dev` | Start the Express + Vite development server |
| `npm start` / `bun start` | Start the same server entrypoint |
| `npm run build` / `bun run build` | Create a production client build in `dist` |
| `npm run preview` / `bun run preview` | Preview the Vite client build |
| `npm run lint` / `bun run lint` | Run the TypeScript no-emit check |

## Main API endpoints

- `GET /api/health` - server and cache health information
- `GET /api/indiapost/pincode?pin=NNNNNN` - look up PIN-code offices
- `POST /api/indiapost/calculate` - calculate one live tariff
- `POST /api/indiapost/scrape-all` - fetch all supported services for one shipment
- `POST /api/indiapost/scrape-batch` - process multiple shipment rows
- `GET /api/indiapost/cache-stats` - inspect local cache counts

The live lookup features depend on the India Post portal. If the portal is unavailable or blocks a request, the application reports the source and uses its offline or cached calculation path where available.

### Local cache behavior

Rate, PIN-office metadata, invalid-PIN exceptions, and batch sync history are
persisted on the server in `rates_cache_v3.json`. Rate entries use normalized
weight slabs for every supported service. Dimension-sensitive parcel services
also include canonical parcel dimensions in the key to prevent a differently
shaped parcel from receiving the wrong cached tariff. Cached entries remain
valid until a request explicitly sets `forceRefresh`; legacy exact parcel keys
are read and migrated to the normalized key on first use.

## Troubleshooting

### Port 3002 is already in use

Stop the process using port 3002, or choose another port temporarily:

```powershell
$env:PORT=3003
npm run dev
```

If you change the port, use the matching port in the browser URL.

### The page loads but API calls fail

Make sure you started `npm run dev` or `bun run dev`, rather than opening the generated HTML file directly. The API routes are provided by the Express server.

### Dependencies or TypeScript errors

Remove `node_modules`, install dependencies again with the package manager used for the checkout, and run:

```powershell
npm run lint
```

Do not expose `.env` values in screenshots, logs, or commits.
