/**
 * India Post Web Scraper & Next.js Server Action Client (V3 Engine)
 * Directly implements the official Next.js Server Actions from https://www.indiapost.gov.in/
 * and https://www.indiapost.gov.in/calculate-postage with persistent rate_cache, pin_cache,
 * and pin_exception storage.
 */

import fs from 'fs';
import path from 'path';

export interface ScrapedPostOffice {
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

export interface PinExceptionEntry {
  pin: string;
  reason: string;
  checkedAt: string;
}

export interface RateCacheEntry {
  fromPin: string;
  toPin: string;
  weightSlab: string;
  service: string;
  price: number;
  baseTariff: number;
  gstAmount: number;
  distanceKm?: number;
  isLocal?: boolean;
  fetchedAt: string;
}

export interface LiveTariffResult {
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

const INDIA_POST_BASE_URL = 'https://www.indiapost.gov.in';
const CALCULATE_POSTAGE_URL = `${INDIA_POST_BASE_URL}/calculate-postage`;

// Official Next.js Server Action IDs & Router State Trees from India Post Rate Calculator V3
const PINCODE_ACTION = '7f04c72a185756a3940501a7996e6b83e2a72a488e';
const FETCH_API_ACTION = '7f343082506e6858e043aa33c21f5343550f670f6f';

const PINCODE_STATE_TREE =
  '%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D';

const CALC_STATE_TREE =
  '%5B%22%22%2C%7B%22children%22%3A%5B%22(controller)%22%2C%7B%22children%22%3A%5B' +
  '%22(home)%22%2C%7B%22children%22%3A%5B%22calculate-postage%22%2C%7B%22children%22%3A%5B' +
  '%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D' +
  '%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';

// Working AppTrana / session cookies (can be refreshed automatically or overridden via UI)
let activeCookieString =
  '_ga=GA1.1.1111940270.1765801333; cookieConsent={%22session%22:true%2C%22persistent%22:true%2C%22preference%22:true}; asdasdasda=U2FsdGVkX18UCcaPi7SHyOpJXNgzELdi8lmVk6yHZaY%3D; sess_map=stztfccxwxcbxqceyyxrxqrrzcsfffztfxdbueawrcuzxxefwuzdsfxqresceqrfxxuawubdbxwqrawaqwfyewqqsrawfaaqaequxddcfdavbzyxescsbtvrbwwyxdaccscuuedxaxcuezwuadscwzyxtezzesesfxvsqsvxaaaayaxq; _gcl_au=1.1.1503747890.1789552244.-.-.1789552243.1551489088.1793607953.1793622530; _ga_X3HX4PKM2P=GS2.1.s1793607952$o66$g1$t1793622907$j56$l0$h1272119553';

let lastSessionInitAt = 0;

// Persistent Cache File on Disk (equivalent to rates_cache_v3.db)
const CACHE_FILE_PATH = path.resolve(process.cwd(), 'rates_cache_v3.json');

interface PersistentStore {
  rate_cache: Record<string, RateCacheEntry>;
  pin_cache: Record<string, PinCacheEntry>;
  pin_exception: Record<string, PinExceptionEntry>;
  sync_history: BatchSyncSessionLog[];
}

const store: PersistentStore = {
  rate_cache: {},
  pin_cache: {},
  pin_exception: {},
  sync_history: [],
};

function loadPersistentStore() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.rate_cache) store.rate_cache = parsed.rate_cache;
      if (parsed.pin_cache) store.pin_cache = parsed.pin_cache;
      if (parsed.pin_exception) store.pin_exception = parsed.pin_exception;
      if (Array.isArray(parsed.sync_history)) store.sync_history = parsed.sync_history.slice(0, 10);
    }
  } catch (err) {
    console.warn('Could not load rates_cache_v3.json, starting fresh:', err);
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSaveStore() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to persist rates_cache_v3.json:', err);
    }
  }, 500);
}

loadPersistentStore();

/**
 * Normalizes weight for Speed Post Doc caching just like V3 Python script:
 * (1, 50, "1-50"), (51, 250, "51-250"), (251, 500, "251-500")
 * Note: For Ordinary Letter, rate changes every 20g, so we normalize by 20g step.
 */
export function normalizeWeightForCache(weight: number, service: string): string {
  const w = Math.max(1, Math.round(weight));
  if (service === 'speed_post' || service === 'Speed Post' || service === 'SP_INLAND_DOC') {
    if (w >= 1 && w <= 50) return '1-50';
    if (w >= 51 && w <= 250) return '51-250';
    if (w >= 251 && w <= 500) return '251-500';
  }
  if (service === 'letter' || service === 'Letter' || service === 'LETTER') {
    const slabTop = Math.ceil(w / 20) * 20;
    return `${slabTop - 19}-${slabTop}`;
  }
  if (service === 'letter_card' || service === 'Letter Card' || service === 'postcard' || service === 'Postcard') {
    return 'fixed';
  }
  return String(w);
}

function makeRateCacheKey(fromPin: string, toPin: string, weight: number, service: string): string {
  const normWeight = normalizeWeightForCache(weight, service);
  return `${fromPin.trim()}|${toPin.trim()}|${normWeight}|${service}`;
}

export function getCacheStats() {
  return {
    rateCacheCount: Object.keys(store.rate_cache).length,
    pinCacheCount: Object.keys(store.pin_cache).length,
    pinExceptionCount: Object.keys(store.pin_exception).length,
    exceptions: Object.values(store.pin_exception),
    syncHistory: store.sync_history.slice(0, 10),
  };
}

export function getSyncHistory(): BatchSyncSessionLog[] {
  return store.sync_history.slice(0, 10);
}

export function clearSyncHistory(): BatchSyncSessionLog[] {
  store.sync_history = [];
  scheduleSaveStore();
  return store.sync_history;
}

export function clearCacheTable(table: 'rate_cache' | 'pin_cache' | 'pin_exception' | 'sync_history' | 'all') {
  if (table === 'rate_cache' || table === 'all') {
    store.rate_cache = {};
  }
  if (table === 'pin_cache' || table === 'all') {
    store.pin_cache = {};
  }
  if (table === 'pin_exception' || table === 'all') {
    store.pin_exception = {};
  }
  if (table === 'sync_history' || table === 'all') {
    store.sync_history = [];
  }
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {}
  return getCacheStats();
}

export function updateScraperSession(input: string): { success: boolean; message: string; cookiePreview: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, message: 'Empty session input', cookiePreview: activeCookieString.slice(0, 60) };
  }

  // Extract -b '...' or -H 'cookie: ...' if user pasted a full cURL command
  const curlCookieMatch =
    trimmed.match(/(?:-b|--cookie)\s+['"]([^'"]+)['"]/i) ||
    trimmed.match(/-H\s+['"]cookie:\s*([^'"]+)['"]/i);

  if (curlCookieMatch && curlCookieMatch[1]) {
    activeCookieString = curlCookieMatch[1].trim();
  } else if (trimmed.toLowerCase().startsWith('cookie:')) {
    activeCookieString = trimmed.substring(7).trim();
  } else {
    activeCookieString = trimmed;
  }

  return {
    success: true,
    message: 'Session cookies updated for live India Post scraping',
    cookiePreview: activeCookieString.slice(0, 80) + (activeCookieString.length > 80 ? '...' : ''),
  };
}

function getActionHeaders(actionId: string, referer: string, stateTree: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'text/x-component',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/plain;charset=UTF-8',
    'Origin': INDIA_POST_BASE_URL,
    'Pragma': 'no-cache',
    'Referer': referer,
    'User-Agent': USER_AGENT,
    'next-action': actionId,
    'next-router-state-tree': stateTree,
    'sec-ch-ua': '"Not:A-Brand";v="8", "Chromium";v="146", "Google Chrome";v="146"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };
  if (activeCookieString) {
    headers['cookie'] = activeCookieString;
  }
  return headers;
}

/**
 * Ensures session is warmed up and harvests any new Set-Cookie headers
 */
async function ensureSessionWarm(): Promise<void> {
  if (Date.now() - lastSessionInitAt < 10 * 60 * 1000) return;
  lastSessionInitAt = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${INDIA_POST_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(activeCookieString ? { cookie: activeCookieString } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Merge new cookie key=value pairs if present
      const parts = setCookie.split(',').map((c) => c.split(';')[0].trim()).filter(Boolean);
      if (parts.length > 0 && !activeCookieString) {
        activeCookieString = parts.join('; ');
      }
    }
  } catch {
    // Ignore warmup network errors
  }
}

/**
 * Exact RSC line parser from V3 Python script:
 * Extracts JSON objects from lines formatted as `prefix:payload`
 */
export function rscJsonObjects(text: string): any[] {
  const objects: any[] = [];
  if (!text) return objects;

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || !line.includes(':')) continue;
    const colonIdx = line.indexOf(':');
    const prefix = line.substring(0, colonIdx);
    const payload = line.substring(colonIdx + 1).trim();
    if (!/^[a-zA-Z0-9]+$/.test(prefix) || (!payload.startsWith('{') && !payload.startsWith('['))) {
      continue;
    }
    try {
      objects.push(JSON.parse(payload));
    } catch {
      continue;
    }
  }
  return objects;
}

export function extractActionPayload(text: string): any {
  const objects = rscJsonObjects(text);
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj && typeof obj === 'object' && ('success' in obj || 'data' in obj || 'error' in obj)) {
      return obj;
    }
  }
  // Fallback chunk splitter
  const chunks = text.split(/(?=\d+:)/);
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    const colonIdx = chunk.indexOf(':');
    if (colonIdx >= 0) {
      const payload = chunk.substring(colonIdx + 1).trim();
      try {
        const obj = JSON.parse(payload);
        if (obj && ('success' in obj || 'data' in obj || 'base_tariff' in obj || 'total_with_tax' in obj)) {
          return obj;
        }
      } catch {}
    }
  }
  return null;
}

async function retryCall<T>(fn: () => Promise<T>, retryOnce: boolean = true): Promise<T> {
  const attempts = retryOnce ? 2 : 1;
  let lastErr: any = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err && err.isPincodeNotFound) {
        throw err;
      }
      lastErr = err;
      if (attempt + 1 < attempts) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }
  throw lastErr;
}

/**
 * Live PIN Code Resolution via India Post GET_PINCODE Server Action
 * Matches lookup_pincode(session, pin) from V3 Python script
 */
export async function scrapePinCodeDetails(
  pincode: string,
  forceRefresh: boolean = false
): Promise<{
  success: boolean;
  offices: ScrapedPostOffice[];
  meta?: PinCacheEntry;
  latencyMs: number;
  source: 'live_portal' | 'cache' | 'pin_exception' | 'error';
  error?: string;
}> {
  const cleanPin = pincode.trim().replace(/\D/g, '');
  if (!/^\d{6}$/.test(cleanPin)) {
    return { success: false, offices: [], latencyMs: 0, source: 'error', error: 'Pincode must be 6 digits' };
  }

  if (!forceRefresh) {
    if (store.pin_exception[cleanPin]) {
      return {
        success: false,
        offices: [],
        latencyMs: 1,
        source: 'pin_exception',
        error: `PINCODE NOT FOUND: ${cleanPin}`,
      };
    }
    const cachedPin = store.pin_cache[cleanPin];
    if (cachedPin) {
      return {
        success: true,
        offices: [
          {
            officeId: cachedPin.officeId,
            officeName: cachedPin.office,
            pincode: cleanPin,
            district: cachedPin.city,
            state: cachedPin.state,
            officeType: 'Delivery Post Office',
            deliveryFlag: true,
          },
        ],
        meta: cachedPin,
        latencyMs: 1,
        source: 'cache',
      };
    }
  }

  await ensureSessionWarm();
  const startTime = Date.now();
  const requestBody = JSON.stringify(['GET_PINCODE', 'GET', null, `?pincode=${cleanPin}&limit=50&office-type=post`]);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Try root URL with PINCODE_STATE_TREE as in V3 script, or calculate-postage with CALC_STATE_TREE
    let response = await fetch(`${INDIA_POST_BASE_URL}/`, {
      method: 'POST',
      headers: getActionHeaders(PINCODE_ACTION, `${INDIA_POST_BASE_URL}/`, PINCODE_STATE_TREE),
      body: requestBody,
      signal: controller.signal,
    });

    if (!response.ok) {
      response = await fetch(CALCULATE_POSTAGE_URL, {
        method: 'POST',
        headers: getActionHeaders(PINCODE_ACTION, CALCULATE_POSTAGE_URL, CALC_STATE_TREE),
        body: requestBody,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return { success: false, offices: [], latencyMs, source: 'error', error: `HTTP ${response.status}` };
    }

    const rawText = await response.text();
    const parsed = extractActionPayload(rawText);
    const data: any[] = (parsed && Array.isArray(parsed.data) ? parsed.data : Array.isArray(parsed) ? parsed : []) || [];

    if (data.length === 0) {
      store.pin_exception[cleanPin] = {
        pin: cleanPin,
        reason: 'Pincode not found',
        checkedAt: new Date().toISOString(),
      };
      scheduleSaveStore();
      return {
        success: false,
        offices: [],
        latencyMs,
        source: 'pin_exception',
        error: `Pincode not found: ${cleanPin}`,
      };
    }

    const delivery = data.find((row: any) => row.delivery_office_flag) || data[0];
    const city = String(delivery.city_name || delivery.taluk_name || delivery.district || '').trim().toUpperCase();
    const state = String(delivery.state_name || delivery.circle_name || '').trim();
    const office = String(delivery.office_name || `POST OFFICE ${cleanPin}`).trim();
    const officeId = String(delivery.office_id || delivery.officeId || '24661902');

    const meta: PinCacheEntry = {
      pin: cleanPin,
      city: city || 'INDIA POST',
      state: state || 'India',
      office,
      officeId,
      checkedAt: new Date().toISOString(),
    };

    store.pin_cache[cleanPin] = meta;
    delete store.pin_exception[cleanPin];
    scheduleSaveStore();

    const offices: ScrapedPostOffice[] = data.map((o: any, idx: number) => ({
      officeId: String(o.office_id || o.officeId || `15660000${idx}`),
      officeName: String(o.office_name || o.officeName || `POST OFFICE ${cleanPin}`),
      pincode: String(o.pincode || cleanPin),
      district: String(o.city_name || o.taluk_name || city).toUpperCase(),
      state: String(o.state_name || state),
      officeType: String(o.office_type_code || 'PO'),
      deliveryFlag: Boolean(o.delivery_office_flag),
    }));

    return {
      success: true,
      offices,
      meta,
      latencyMs,
      source: 'live_portal',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      offices: [],
      latencyMs,
      source: 'error',
      error: err.message || 'Network timeout',
    };
  }
}

/**
 * Low-level India Post Master Data Management Server Action caller
 * Matches fetch_api(session, path) in V3 Python script
 */
export async function fetchIndiaPostApi(apiPath: string): Promise<{ data: any; latencyMs: number }> {
  await ensureSessionWarm();
  const startTime = Date.now();
  const payload = JSON.stringify(['BASE_URL_BACKEND_MASTER_DATA_MANAGEMENT', 'GET', null, apiPath]);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(CALCULATE_POSTAGE_URL, {
      method: 'POST',
      headers: getActionHeaders(FETCH_API_ACTION, CALCULATE_POSTAGE_URL, CALC_STATE_TREE),
      body: payload,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from indiapost.gov.in`);
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    if (!contentType.includes('text/x-component') && !rawText.includes('0:')) {
      throw new Error('India Post returned non-action response (possible WAF challenge)');
    }

    const parsed = extractActionPayload(rawText);
    if (!parsed) {
      throw new Error('Could not parse India Post action response');
    }
    if (parsed.success === false) {
      const errMsg = parsed.error?.message || parsed.error || parsed.message || 'API request failed';
      throw new Error(String(errMsg));
    }
    const d = parsed.data !== undefined ? parsed.data : parsed;
    if (d === null || d === undefined) {
      throw new Error('API returned success but no data');
    }
    return { data: d, latencyMs };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extracts price & tax fields from India Post API response
 * Matches money_from_data(data) in V3 Python script while preserving base_tariff & GST
 */
export function extractTariffAmounts(rawData: any): {
  basePostage: number;
  gstAmount: number;
  totalPostage: number;
  exactGstAmount: number;
  exactTotalPostage: number;
  distanceKm?: number;
  isLocal?: boolean;
} {
  const data = Array.isArray(rawData) ? (rawData[0] || {}) : (rawData || {});

  // Exact V3 priority order for total price: ("total_with_tax", "price", "tariff_after_discount", "base_tariff")
  let totalWithTax: number | null = null;
  for (const key of ['total_with_tax', 'price', 'tariff_after_discount', 'base_tariff']) {
    if (data[key] !== undefined && data[key] !== null) {
      totalWithTax = parseFloat(String(data[key]));
      break;
    }
  }

  const base = parseFloat(String(data.base_tariff ?? data.tariff_after_discount ?? data.price ?? totalWithTax ?? 0));
  const gstRaw =
    data.gst !== undefined && data.gst !== null
      ? parseFloat(String(data.gst))
      : data.cgst !== undefined && data.sgst !== undefined
      ? parseFloat(String(data.cgst)) + parseFloat(String(data.sgst))
      : Math.max(0, (totalWithTax ?? base) - base);

  const total = totalWithTax !== null && totalWithTax > 0 ? totalWithTax : base + gstRaw;
  const exactGst = gstRaw > 0 ? Math.round(base * 0.18 * 100) / 100 : 0;
  const exactTotal = gstRaw > 0 ? Math.round((base + exactGst) * 100) / 100 : total;

  return {
    basePostage: base,
    gstAmount: gstRaw,
    totalPostage: total,
    exactGstAmount: exactGst,
    exactTotalPostage: exactTotal,
    distanceKm: data.distance !== undefined ? Number(data.distance) : undefined,
    isLocal: data.local_flag !== undefined ? Boolean(data.local_flag) : undefined,
  };
}

export interface LiveTariffParams {
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
}

/**
 * Dispatches Live Tariff Calculation to India Post Master Data Management Server Action
 */
export async function scrapeLiveTariff(params: LiveTariffParams): Promise<LiveTariffResult> {
  const fromPin = params.originPin.trim();
  const toPin = params.destPin.trim();
  const weight = Math.max(1, Math.round(params.weightGrams));
  const retryOnce = params.retryOnce !== false;

  // Determine whether Speed Post should call Doc or Parcel
  const isParcelMode =
    params.product === 'speed_post_parcel' ||
    params.product === 'business_parcel' ||
    params.product === 'registered_parcel' ||
    (params.product === 'speed_post' && (weight > 500 || (params.lengthCm && params.lengthCm > 0)));

  const effectiveServiceKey =
    params.product === 'speed_post' && isParcelMode ? 'speed_post_parcel' : params.product;

  const cacheKey = isParcelMode
    ? `${effectiveServiceKey}|${fromPin}|${toPin}|${weight}|${params.lengthCm || 14}x${params.widthCm || 9}x${params.heightCm || 1}`
    : makeRateCacheKey(fromPin, toPin, weight, effectiveServiceKey);

  if (!params.forceRefresh && store.rate_cache[cacheKey]) {
    const cached = store.rate_cache[cacheKey];
    const exactGst = cached.gstAmount > 0 ? Math.round(cached.baseTariff * 0.18 * 100) / 100 : 0;
    return {
      isLive: true,
      source: 'cached_portal',
      latencyMs: 1,
      productCode: effectiveServiceKey.toUpperCase(),
      serviceName: cached.service,
      basePostage: cached.baseTariff,
      gstAmount: cached.gstAmount,
      totalPostage: cached.price,
      exactGstAmount: exactGst,
      exactTotalPostage: cached.gstAmount > 0 ? Math.round((cached.baseTariff + exactGst) * 100) / 100 : cached.price,
      distanceKm: cached.distanceKm,
      isLocal: cached.isLocal,
      fromCity: store.pin_cache[fromPin]?.city,
      toCity: store.pin_cache[toPin]?.city,
    };
  }

  // Validate PINs via GET_PINCODE first (also gives us officeId for parcels)
  const [fromPinRes, toPinRes] = await Promise.all([
    scrapePinCodeDetails(fromPin, params.forceRefresh),
    scrapePinCodeDetails(toPin, params.forceRefresh),
  ]);

  if (fromPinRes.source === 'pin_exception' || toPinRes.source === 'pin_exception') {
    const badPin = fromPinRes.source === 'pin_exception' ? fromPin : toPin;
    return {
      isLive: false,
      source: 'pin_exception',
      latencyMs: fromPinRes.latencyMs + toPinRes.latencyMs,
      productCode: 'PINCODE_NOT_FOUND',
      basePostage: 0,
      gstAmount: 0,
      totalPostage: 0,
      error: `PINCODE NOT FOUND: ${badPin}`,
    };
  }

  const l = params.lengthCm || 14;
  const w = params.widthCm || 9;
  const h = params.heightCm || 1;
  const srcOffice = params.sourceOfficeId || fromPinRes.meta?.officeId || fromPinRes.offices[0]?.officeId || '24661902';
  const dstOffice = params.destOfficeId || toPinRes.meta?.officeId || toPinRes.offices[0]?.officeId || '21350001';

  let apiPath = '';
  let productCode = '';
  let serviceLabel = '';

  if (effectiveServiceKey === 'speed_post') {
    productCode = 'SP_INLAND_DOC';
    serviceLabel = 'Speed Post';
    apiPath = `/domestic-tariffs/speed-post-doc-discount?product-code=SP_INLAND_DOC&weight=${encodeURIComponent(
      String(weight)
    )}&source-pincode=${encodeURIComponent(fromPin)}&destination-pincode=${encodeURIComponent(toPin)}`;
  } else if (effectiveServiceKey === 'speed_post_parcel') {
    productCode = 'SP_INLAND_PARCEL';
    serviceLabel = 'Speed Post Parcel';
    apiPath = `/domestic-tariffs/speed-post-parcel-revised?product-code=SP_INLAND_PARCEL&height=${h}&length=${l}&width=${w}&weight=${weight}&source-pincode=${encodeURIComponent(
      fromPin
    )}&destination-pincode=${encodeURIComponent(toPin)}&source-office-id=${encodeURIComponent(
      srcOffice
    )}&destination-office-id=${encodeURIComponent(dstOffice)}`;
  } else if (effectiveServiceKey === 'business_parcel') {
    productCode = 'BUSINESS_PARCEL';
    serviceLabel = 'India Post Parcel (Contractual)';
    apiPath = `/domestic-tariffs/business-parcels-revised?product-code=BUSINESS_PARCEL&length=${l}&width=${w}&height=${h}&weight=${weight}&source-pincode=${encodeURIComponent(
      fromPin
    )}&destination-pincode=${encodeURIComponent(toPin)}&source-office-id=${encodeURIComponent(
      srcOffice
    )}&destination-office-id=${encodeURIComponent(dstOffice)}`;
  } else if (effectiveServiceKey === 'registered_parcel') {
    productCode = 'PARCEL';
    serviceLabel = 'India Post Parcel (Retail)';
    apiPath = `/domestic-tariffs/parcels-revised?product-code=PARCEL&length=${l}&width=${w}&height=${h}&weight=${weight}&source-pincode=${encodeURIComponent(
      fromPin
    )}&destination-pincode=${encodeURIComponent(toPin)}&source-office-id=${encodeURIComponent(
      srcOffice
    )}&destination-office-id=${encodeURIComponent(dstOffice)}`;
  } else if (effectiveServiceKey === 'letter_card') {
    productCode = 'LETTER_CARD_S';
    serviceLabel = 'Letter Card';
    apiPath = `/poreg/domestic-tariffs/letter-cards?product-code=LETTER_CARD_S&source-pincode=${encodeURIComponent(
      fromPin
    )}&weight=5`;
  } else if (effectiveServiceKey === 'postcard') {
    productCode = 'POSTCARD';
    serviceLabel = 'Postcard';
    apiPath = `/poreg/domestic-tariffs/postcards?product-code=POSTCARD&source-pincode=${encodeURIComponent(fromPin)}`;
  } else {
    productCode = 'LETTER';
    serviceLabel = 'Letter';
    apiPath = `/poreg/domestic-tariffs/letters?product-code=LETTER&weight=${encodeURIComponent(
      String(weight)
    )}&source-pincode=${encodeURIComponent(fromPin)}`;
  }

  try {
    const { data, latencyMs } = await retryCall(() => fetchIndiaPostApi(apiPath), retryOnce);
    const amounts = extractTariffAmounts(data);

    // Save to persistent rate_cache
    store.rate_cache[cacheKey] = {
      fromPin,
      toPin,
      weightSlab: normalizeWeightForCache(weight, effectiveServiceKey),
      service: serviceLabel,
      price: amounts.totalPostage,
      baseTariff: amounts.basePostage,
      gstAmount: amounts.gstAmount,
      distanceKm: amounts.distanceKm,
      isLocal: amounts.isLocal,
      fetchedAt: new Date().toISOString(),
    };
    scheduleSaveStore();

    return {
      isLive: true,
      source: 'live_indiapost_portal',
      latencyMs,
      productCode,
      serviceName: serviceLabel,
      basePostage: amounts.basePostage,
      gstAmount: amounts.gstAmount,
      totalPostage: amounts.totalPostage,
      exactGstAmount: amounts.exactGstAmount,
      exactTotalPostage: amounts.exactTotalPostage,
      distanceKm: amounts.distanceKm,
      isLocal: amounts.isLocal,
      fromCity: fromPinRes.meta?.city,
      toCity: toPinRes.meta?.city,
      rawData: data,
    };
  } catch (err: any) {
    const errMsg = err.message || 'Portal request failed';
    return {
      isLive: false,
      source: 'offline_engine_fallback',
      latencyMs: 0,
      productCode,
      serviceName: serviceLabel,
      basePostage: 0,
      gstAmount: 0,
      totalPostage: 0,
      fromCity: fromPinRes.meta?.city,
      toCity: toPinRes.meta?.city,
      error: errMsg,
      isBlocked: true,
    };
  }
}

/**
 * Scrapes all services in parallel for the Single Parcel / Letter Estimator
 * (and matches V3 fetch_rates_for_task for the 4 Letter services + 3 Parcel services)
 */
export async function scrapeAllServicesForEstimator(params: {
  originPin: string;
  destPin: string;
  weightGrams: number;
  articleType: 'Letter' | 'Parcel';
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  forceRefresh?: boolean;
}) {
  const startTime = Date.now();
  const fromPin = params.originPin.trim();
  const toPin = params.destPin.trim();
  const weight = Math.max(1, Math.round(params.weightGrams));

  // First resolve both PIN codes in parallel
  const [originPinRes, destPinRes] = await Promise.all([
    scrapePinCodeDetails(fromPin, params.forceRefresh),
    scrapePinCodeDetails(toPin, params.forceRefresh),
  ]);

  const srcOffice = originPinRes.meta?.officeId || originPinRes.offices[0]?.officeId || '24661902';
  const dstOffice = destPinRes.meta?.officeId || destPinRes.offices[0]?.officeId || '21350001';

  if (params.articleType === 'Letter') {
    const [speedPostDoc, letterCard, letter, postcard] = await Promise.all([
      scrapeLiveTariff({
        product: 'speed_post',
        weightGrams: Math.min(500, weight),
        originPin: fromPin,
        destPin: toPin,
        forceRefresh: params.forceRefresh,
      }),
      scrapeLiveTariff({
        product: 'letter_card',
        weightGrams: 5,
        originPin: fromPin,
        destPin: toPin,
        forceRefresh: params.forceRefresh,
      }),
      scrapeLiveTariff({
        product: 'letter',
        weightGrams: Math.min(500, weight),
        originPin: fromPin,
        destPin: toPin,
        forceRefresh: params.forceRefresh,
      }),
      scrapeLiveTariff({
        product: 'postcard',
        weightGrams: 5,
        originPin: fromPin,
        destPin: toPin,
        forceRefresh: params.forceRefresh,
      }),
    ]);

    return {
      isLive: speedPostDoc.isLive || letter.isLive,
      latencyMs: Date.now() - startTime,
      originMeta: originPinRes.meta || null,
      destMeta: destPinRes.meta || null,
      pinException:
        originPinRes.source === 'pin_exception'
          ? fromPin
          : destPinRes.source === 'pin_exception'
          ? toPin
          : null,
      distanceKm: speedPostDoc.distanceKm,
      isLocal: speedPostDoc.isLocal,
      services: {
        speed_post_doc: speedPostDoc,
        letter_card: letterCard,
        letter,
        postcard,
      },
      cacheStats: getCacheStats(),
    };
  } else {
    const [speedPostParcel, businessParcel, registeredParcel] = await Promise.all([
      scrapeLiveTariff({
        product: 'speed_post_parcel',
        weightGrams: weight,
        originPin: fromPin,
        destPin: toPin,
        lengthCm: params.lengthCm || 14,
        widthCm: params.widthCm || 9,
        heightCm: params.heightCm || 1,
        sourceOfficeId: srcOffice,
        destOfficeId: dstOffice,
        forceRefresh: params.forceRefresh,
      }),
      scrapeLiveTariff({
        product: 'business_parcel',
        weightGrams: weight,
        originPin: fromPin,
        destPin: toPin,
        lengthCm: params.lengthCm || 14,
        widthCm: params.widthCm || 9,
        heightCm: params.heightCm || 1,
        sourceOfficeId: srcOffice,
        destOfficeId: dstOffice,
        forceRefresh: params.forceRefresh,
      }),
      scrapeLiveTariff({
        product: 'registered_parcel',
        weightGrams: weight,
        originPin: fromPin,
        destPin: toPin,
        lengthCm: params.lengthCm || 14,
        widthCm: params.widthCm || 9,
        heightCm: params.heightCm || 1,
        sourceOfficeId: srcOffice,
        destOfficeId: dstOffice,
        forceRefresh: params.forceRefresh,
      }),
    ]);

    return {
      isLive: speedPostParcel.isLive || businessParcel.isLive || registeredParcel.isLive,
      latencyMs: Date.now() - startTime,
      originMeta: originPinRes.meta || null,
      destMeta: destPinRes.meta || null,
      pinException:
        originPinRes.source === 'pin_exception'
          ? fromPin
          : destPinRes.source === 'pin_exception'
          ? toPin
          : null,
      distanceKm: speedPostParcel.distanceKm ?? businessParcel.distanceKm ?? registeredParcel.distanceKm,
      isLocal: speedPostParcel.isLocal ?? businessParcel.isLocal ?? registeredParcel.isLocal,
      services: {
        speed_post_parcel: speedPostParcel,
        business_parcel: businessParcel,
        registered_parcel: registeredParcel,
      },
      cacheStats: getCacheStats(),
    };
  }
}

/**
 * Batch Scraper for Bulk Spreadsheet & V3 Multi-Task Runner
 */
export interface BatchScrapeItemRequest {
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
}

export async function scrapeBatchTariffs(
  items: BatchScrapeItemRequest[],
  sessionId?: string
) {
  const chunkStart = Date.now();
  const results: Record<string, LiveTariffResult> = {};
  const CONCURRENCY = 4;

  let chunkLive = 0;
  let chunkCached = 0;
  let chunkPinExceptions = 0;
  let chunkBlocked = 0;
  const chunkBlockedLogs: BlockedRequestLog[] = [];

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const slice = items.slice(i, i + CONCURRENCY);
    await Promise.all(
      slice.map(async (item) => {
        if (!/^\d{6}$/.test(item.originPin.trim())) {
          const reason = 'From pincode must be 6 digits';
          results[item.id] = {
            isLive: false,
            source: 'offline_engine_fallback',
            latencyMs: 0,
            productCode: 'INVALID_FROM_PIN',
            basePostage: 0,
            gstAmount: 0,
            totalPostage: 0,
            error: reason,
            isBlocked: true,
          };
          chunkBlocked += 1;
          chunkBlockedLogs.push({
            itemId: item.id,
            route: `${item.originPin} → ${item.destPin}`,
            service: item.serviceType,
            reason,
            timestamp: new Date().toISOString(),
          });
          return;
        }
        if (!/^\d{6}$/.test(item.destPin.trim())) {
          const reason = 'To pincode must be 6 digits';
          results[item.id] = {
            isLive: false,
            source: 'offline_engine_fallback',
            latencyMs: 0,
            productCode: 'INVALID_TO_PIN',
            basePostage: 0,
            gstAmount: 0,
            totalPostage: 0,
            error: reason,
            isBlocked: true,
          };
          chunkBlocked += 1;
          chunkBlockedLogs.push({
            itemId: item.id,
            route: `${item.originPin} → ${item.destPin}`,
            service: item.serviceType,
            reason,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const productMap: Record<string, LiveTariffParams['product']> = {
          speed_post: item.weightGrams > 500 || item.lengthCm ? 'speed_post_parcel' : 'speed_post',
          speed_post_parcel: 'speed_post_parcel',
          business_parcel: 'business_parcel',
          registered_parcel: 'registered_parcel',
          letter: 'letter',
          letter_card: 'letter_card',
          postcard: 'postcard',
          registered_letter: 'letter',
        };

        const prod = productMap[item.serviceType] || 'speed_post';
        const res = await scrapeLiveTariff({
          product: prod,
          weightGrams: item.weightGrams,
          originPin: item.originPin,
          destPin: item.destPin,
          lengthCm: item.lengthCm,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          forceRefresh: item.forceRefresh,
          retryOnce: item.retryOnce,
        });
        results[item.id] = res;

        if (res.source === 'live_indiapost_portal') {
          chunkLive += 1;
        } else if (res.source === 'cached_portal') {
          chunkCached += 1;
        } else if (res.source === 'pin_exception') {
          chunkPinExceptions += 1;
        } else {
          chunkBlocked += 1;
          chunkBlockedLogs.push({
            itemId: item.id,
            route: `${item.originPin} → ${item.destPin} (${item.weightGrams}g)`,
            service: res.serviceName || item.serviceType,
            reason: res.error || 'AppTrana WAF / Portal Request Blocked',
            timestamp: new Date().toISOString(),
          });
        }
      })
    );
  }

  // Record or merge into Sync History (last 10 batch scraping sessions)
  if (items.length > 0) {
    const effectiveSessionId = sessionId || `BATCH-${Date.now()}`;
    const chunkDuration = Date.now() - chunkStart;
    const nowIso = new Date().toISOString();
    const existingIdx = store.sync_history.findIndex((s) => s.sessionId === effectiveSessionId);

    if (existingIdx >= 0) {
      const prev = store.sync_history[existingIdx];
      const totalItems = prev.totalItems + items.length;
      const liveCount = prev.liveCount + chunkLive;
      const cachedCount = prev.cachedCount + chunkCached;
      const pinExceptionCount = prev.pinExceptionCount + chunkPinExceptions;
      const blockedCount = prev.blockedCount + chunkBlocked;
      const succeeded = liveCount + cachedCount;
      const successRate = Math.round((succeeded / Math.max(1, totalItems)) * 100);
      const status: BatchSyncSessionLog['status'] =
        blockedCount === 0
          ? 'healthy'
          : succeeded === 0
          ? 'waf_blocked'
          : 'partial_block';

      store.sync_history[existingIdx] = {
        ...prev,
        completedAt: nowIso,
        durationMs: prev.durationMs + chunkDuration,
        totalItems,
        liveCount,
        cachedCount,
        pinExceptionCount,
        blockedCount,
        successRate,
        status,
        blockedRequests: [...prev.blockedRequests, ...chunkBlockedLogs].slice(0, 25),
      };
    } else {
      const totalItems = items.length;
      const succeeded = chunkLive + chunkCached;
      const successRate = Math.round((succeeded / Math.max(1, totalItems)) * 100);
      const status: BatchSyncSessionLog['status'] =
        chunkBlocked === 0
          ? 'healthy'
          : succeeded === 0
          ? 'waf_blocked'
          : 'partial_block';

      const newSession: BatchSyncSessionLog = {
        sessionId: effectiveSessionId,
        startedAt: new Date(chunkStart).toISOString(),
        completedAt: nowIso,
        durationMs: chunkDuration,
        originPin: items[0]?.originPin || '400703',
        totalItems,
        liveCount: chunkLive,
        cachedCount: chunkCached,
        pinExceptionCount: chunkPinExceptions,
        blockedCount: chunkBlocked,
        successRate,
        status,
        blockedRequests: chunkBlockedLogs.slice(0, 25),
      };

      store.sync_history = [newSession, ...store.sync_history].slice(0, 10);
    }

    scheduleSaveStore();
  }

  return {
    results,
    cacheStats: getCacheStats(),
    syncHistory: getSyncHistory(),
  };
}

/**
 * Health check & Benchmark against https://www.indiapost.gov.in/calculate-postage
 */
export async function benchmarkPortalConnection(): Promise<{
  online: boolean;
  latencyMs: number;
  url: string;
  statusCode: number;
  serverHeader: string;
  timestamp: string;
  cacheStats: ReturnType<typeof getCacheStats>;
}> {
  const startTime = Date.now();
  try {
    // Test a live postcard action call to verify RSC Server Action health
    const { latencyMs } = await fetchIndiaPostApi(
      '/poreg/domestic-tariffs/postcards?product-code=POSTCARD&source-pincode=400703'
    );
    return {
      online: true,
      latencyMs,
      url: CALCULATE_POSTAGE_URL,
      statusCode: 200,
      serverHeader: 'Next.js RSC Action (Active)',
      timestamp: new Date().toISOString(),
      cacheStats: getCacheStats(),
    };
  } catch (err: any) {
    return {
      online: false,
      latencyMs: Date.now() - startTime,
      url: CALCULATE_POSTAGE_URL,
      statusCode: 0,
      serverHeader: err.message || 'Unreachable / Timeout',
      timestamp: new Date().toISOString(),
      cacheStats: getCacheStats(),
    };
  }
}
