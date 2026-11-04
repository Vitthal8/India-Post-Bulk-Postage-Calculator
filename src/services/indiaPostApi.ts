/**
 * Client Service for India Post V3 Web Scraping & Server Action Engine
 */

export type CalculatorMode = 'online' | 'offline';

export interface LiveOfficeInfo {
  officeId: string;
  officeName: string;
  pincode: string;
  district: string;
  state: string;
  officeType: string;
  deliveryFlag?: boolean;
}

export interface PinCacheEntry {
  pin: string;
  city: string;
  state: string;
  office: string;
  officeId: string;
  checkedAt: string;
}

export interface LiveTariffResponse {
  isLive: boolean;
  source: 'live_indiapost_portal' | 'cached_portal' | 'offline_engine_fallback' | 'pin_exception';
  latencyMs: number;
  productCode: string;
  serviceName?: string;
  basePostage: number;
  gstAmount: number;
  totalPostage: number;
  exactGstAmount?: number;
  exactTotalPostage?: number;
  distanceKm?: number;
  isLocal?: boolean;
  fromCity?: string;
  toCity?: string;
  rawData?: any;
  error?: string;
  isBlocked?: boolean;
}

export interface BlockedRequestLog {
  itemId: string;
  route: string;
  service: string;
  reason: string;
  timestamp: string;
}

export interface BatchSyncSessionLog {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  originPin: string;
  totalItems: number;
  liveCount: number;
  cachedCount: number;
  pinExceptionCount: number;
  blockedCount: number;
  successRate: number; // 0 - 100
  status: 'healthy' | 'partial_block' | 'waf_blocked';
  blockedRequests: BlockedRequestLog[];
}

export interface CacheStatsResponse {
  rateCacheCount: number;
  pinCacheCount: number;
  pinExceptionCount: number;
  exceptions?: { pin: string; reason: string; checkedAt: string }[];
  syncHistory?: BatchSyncSessionLog[];
}

export interface PortalBenchmarkResponse {
  online: boolean;
  latencyMs: number;
  url: string;
  statusCode: number;
  serverHeader: string;
  timestamp: string;
  cacheStats?: CacheStatsResponse;
}

export interface ScrapeAllServicesResponse {
  isLive: boolean;
  latencyMs: number;
  originMeta: PinCacheEntry | null;
  destMeta: PinCacheEntry | null;
  pinException: string | null;
  distanceKm?: number;
  isLocal?: boolean;
  services: {
    speed_post_doc?: LiveTariffResponse;
    letter_card?: LiveTariffResponse;
    letter?: LiveTariffResponse;
    postcard?: LiveTariffResponse;
    speed_post_parcel?: LiveTariffResponse;
    business_parcel?: LiveTariffResponse;
    registered_parcel?: LiveTariffResponse;
  };
  cacheStats?: CacheStatsResponse;
}

export async function fetchLivePinOffices(pincode: string, force: boolean = false): Promise<{
  success: boolean;
  offices: LiveOfficeInfo[];
  meta?: PinCacheEntry;
  latencyMs: number;
  source: 'live_portal' | 'cache' | 'pin_exception' | 'error';
  error?: string;
}> {
  try {
    const res = await fetch(`/api/indiapost/pincode?pin=${encodeURIComponent(pincode)}${force ? '&force=true' : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      offices: [],
      latencyMs: 0,
      source: 'error',
      error: err.message,
    };
  }
}

export async function fetchLiveTariff(params: {
  product:
    | 'speed_post'
    | 'speed_post_parcel'
    | 'registered_parcel'
    | 'registered_letter'
    | 'business_parcel'
    | 'letter'
    | 'letter_card'
    | 'postcard';
  weightGrams: number;
  originPin: string;
  destPin: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  sourceOfficeId?: string;
  destOfficeId?: string;
  forceRefresh?: boolean;
  retryOnce?: boolean;
  mode?: CalculatorMode;
}): Promise<LiveTariffResponse> {
  try {
    const res = await fetch('/api/indiapost/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      isLive: false,
      source: 'offline_engine_fallback',
      latencyMs: 0,
      productCode: params.product,
      basePostage: 0,
      gstAmount: 0,
      totalPostage: 0,
      error: err.message,
    };
  }
}

export async function fetchAllLiveServices(params: {
  originPin: string;
  destPin: string;
  weightGrams: number;
  articleType: 'Letter' | 'Parcel';
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  forceRefresh?: boolean;
  mode?: CalculatorMode;
}): Promise<ScrapeAllServicesResponse> {
  const res = await fetch('/api/indiapost/scrape-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchBatchLiveTariffs(
  items: {
    id: string;
    originPin: string;
    destPin: string;
    weightGrams: number;
    serviceType: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    forceRefresh?: boolean;
    retryOnce?: boolean;
  }[],
  sessionId?: string,
  mode: CalculatorMode = 'online'
): Promise<{
  results: Record<string, LiveTariffResponse>;
  cacheStats?: CacheStatsResponse;
  syncHistory?: BatchSyncSessionLog[];
}> {
  const res = await fetch('/api/indiapost/scrape-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, sessionId, mode }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchSyncHistory(): Promise<BatchSyncSessionLog[]> {
  try {
    const res = await fetch('/api/indiapost/sync-history');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.syncHistory) ? data.syncHistory : [];
  } catch {
    return [];
  }
}

export async function clearServerSyncHistory(): Promise<BatchSyncSessionLog[]> {
  try {
    const res = await fetch('/api/indiapost/sync-history', { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.syncHistory) ? data.syncHistory : [];
  } catch {
    return [];
  }
}

export async function fetchCacheStats(): Promise<CacheStatsResponse> {
  try {
    const res = await fetch('/api/indiapost/cache-stats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { rateCacheCount: 0, pinCacheCount: 0, pinExceptionCount: 0 };
  }
}

export function downloadCacheExport(): void {
  const link = document.createElement('a');
  link.href = '/api/indiapost/cache-export';
  link.download = 'rates_cache_v3.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function importCacheSnapshot(snapshot: unknown): Promise<CacheStatsResponse> {
  const res = await fetch('/api/indiapost/cache-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data.stats;
}

export async function clearServerCache(
  table: 'rate_cache' | 'pin_cache' | 'pin_exception' | 'sync_history' | 'all'
): Promise<CacheStatsResponse> {
  const res = await fetch('/api/indiapost/cache-clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.stats;
}

export async function updateServerSession(sessionInput: string): Promise<{
  success: boolean;
  message: string;
  cookiePreview: string;
}> {
  const res = await fetch('/api/indiapost/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionInput }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchPortalBenchmark(): Promise<PortalBenchmarkResponse> {
  try {
    const res = await fetch('/api/indiapost/benchmark');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      online: false,
      latencyMs: 0,
      url: 'https://www.indiapost.gov.in/calculate-postage',
      statusCode: 0,
      serverHeader: 'Offline / Proxy unreachable',
      timestamp: new Date().toISOString(),
    };
  }
}
