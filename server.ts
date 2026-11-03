import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  scrapePinCodeDetails,
  scrapeLiveTariff,
  scrapeAllServicesForEstimator,
  scrapeBatchTariffs,
  benchmarkPortalConnection,
  getCacheStats,
  clearCacheTable,
  getSyncHistory,
  clearSyncHistory,
  updateScraperSession,
  LiveTariffParams,
  BatchScrapeItemRequest,
} from './server/indiaPostScraper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Route: Live PIN Code details & Office IDs lookup from indiapost.gov.in
  app.get('/api/indiapost/pincode', async (req, res) => {
    const pin = (req.query.pin as string) || '';
    const force = req.query.force === 'true';
    if (!pin || pin.length !== 6) {
      return res.status(400).json({ success: false, error: '6-digit PIN required' });
    }
    const result = await scrapePinCodeDetails(pin, force);
    return res.json(result);
  });

  // API Route: Single Live Tariff calculation
  app.post('/api/indiapost/calculate', async (req, res) => {
    try {
      const params = req.body as LiveTariffParams;
      const result = await scrapeLiveTariff(params);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        isLive: false,
        source: 'offline_engine_fallback',
        error: err.message || 'Internal error calculating tariff',
      });
    }
  });

  // API Route: Scrape all services in parallel for Single Parcel / Letter Estimator (or V3 4-service fetch)
  app.post('/api/indiapost/scrape-all', async (req, res) => {
    try {
      const result = await scrapeAllServicesForEstimator(req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        isLive: false,
        error: err.message || 'Error scraping all services',
      });
    }
  });

  // API Route: Batch live scraping for Bulk Spreadsheet & V3 Multi-PIN/Weight Runner
  app.post('/api/indiapost/scrape-batch', async (req, res) => {
    try {
      const items = (req.body?.items || []) as BatchScrapeItemRequest[];
      const sessionId = (req.body?.sessionId || undefined) as string | undefined;
      const result = await scrapeBatchTariffs(items, sessionId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        results: {},
        error: err.message || 'Batch scrape failed',
      });
    }
  });

  // API Route: Sync History of last 10 batch scraping sessions
  app.get('/api/indiapost/sync-history', (req, res) => {
    return res.json({ syncHistory: getSyncHistory() });
  });

  app.delete('/api/indiapost/sync-history', (req, res) => {
    const syncHistory = clearSyncHistory();
    return res.json({ success: true, syncHistory });
  });

  // API Route: Persistent V3 Cache Stats (rate_cache, pin_cache, pin_exception, syncHistory)
  app.get('/api/indiapost/cache-stats', (req, res) => {
    return res.json(getCacheStats());
  });

  // API Route: Clear Persistent Cache Table
  app.post('/api/indiapost/cache-clear', (req, res) => {
    const table = (req.body?.table || 'all') as 'rate_cache' | 'pin_cache' | 'pin_exception' | 'sync_history' | 'all';
    const stats = clearCacheTable(table);
    return res.json({ success: true, stats });
  });

  // API Route: Update Session Cookies / cURL
  app.post('/api/indiapost/session', (req, res) => {
    const input = (req.body?.sessionInput || '') as string;
    const result = updateScraperSession(input);
    return res.json(result);
  });

  // API Route: Live Connection Benchmark & Status
  app.get('/api/indiapost/benchmark', async (req, res) => {
    const result = await benchmarkPortalConnection();
    return res.json(result);
  });

  // System Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      server: 'India Post Bulk Postage Engine V3',
      cacheStats: getCacheStats(),
      timestamp: new Date().toISOString(),
    });
  });

  // Vite development middleware or static production serve
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> India Post Postage Engine V3 server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
