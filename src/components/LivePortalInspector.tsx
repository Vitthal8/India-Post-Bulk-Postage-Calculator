import React, { useState, useEffect } from 'react';
import {
  fetchPortalBenchmark,
  fetchAllLiveServices,
  updateServerSession,
  fetchSyncHistory,
  clearServerSyncHistory,
  downloadCacheExport,
  importCacheSnapshot,
  PortalBenchmarkResponse,
  BatchSyncSessionLog,
} from '../services/indiaPostApi';
import {
  Activity,
  Terminal,
  Play,
  RefreshCw,
  X,
  KeyRound,
  History,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LivePortalInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  originPin: string;
}

export const LivePortalInspector: React.FC<LivePortalInspectorProps> = ({
  isOpen,
  onClose,
  originPin,
}) => {
  const [benchmark, setBenchmark] = useState<PortalBenchmarkResponse | null>(null);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);

  // Sync History State (Last 10 Batch Scraping Sessions)
  const [syncHistory, setSyncHistory] = useState<BatchSyncSessionLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Live V3 4-service test runner state
  const [testOriginPin, setTestOriginPin] = useState(originPin || '400703');
  const [testDestPin, setTestDestPin] = useState('411048');
  const [testWeight, setTestWeight] = useState(75);
  const [testArticleType, setTestArticleType] = useState<'Letter' | 'Parcel'>('Letter');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Session Cookie / cURL Importer
  const [sessionInput, setSessionInput] = useState('');
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  // DevTools RSC Calibrator
  const [pastedRsc, setPastedRsc] = useState('');
  const [parsedRscResult, setParsedRscResult] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [isImportingCache, setIsImportingCache] = useState(false);
  const cacheFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTestOriginPin(originPin);
  }, [originPin]);

  useEffect(() => {
    if (isOpen) {
      loadBenchmark();
      loadSyncHistory();
    }
  }, [isOpen]);

  const loadBenchmark = async () => {
    setIsLoadingBenchmark(true);
    const res = await fetchPortalBenchmark();
    setBenchmark(res);
    if (res.cacheStats?.syncHistory) {
      setSyncHistory(res.cacheStats.syncHistory.slice(0, 10));
    }
    setIsLoadingBenchmark(false);
  };

  const loadSyncHistory = async () => {
    setIsLoadingHistory(true);
    const list = await fetchSyncHistory();
    setSyncHistory(list.slice(0, 10));
    setIsLoadingHistory(false);
  };

  const handleClearSyncHistory = async () => {
    const list = await clearServerSyncHistory();
    setSyncHistory(list);
    setExpandedSessionId(null);
  };

  const handleCacheImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImportingCache(true);
    setCacheStatus(null);
    try {
      const snapshot = JSON.parse(await file.text());
      const stats = await importCacheSnapshot(snapshot);
      setBenchmark((previous) => (previous ? { ...previous, cacheStats: stats } : previous));
      setCacheStatus(`Imported ${stats.rateCacheCount.toLocaleString()} rates and ${stats.pinCacheCount.toLocaleString()} PINs.`);
    } catch (err: any) {
      setCacheStatus(`Import failed: ${err.message || 'Invalid cache file'}`);
    } finally {
      setIsImportingCache(false);
    }
  };

  const runLiveTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetchAllLiveServices({
        originPin: testOriginPin,
        destPin: testDestPin,
        weightGrams: testWeight,
        articleType: testArticleType,
        forceRefresh: true,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message });
    }
    setIsTesting(false);
  };

  const handleSaveSession = async () => {
    if (!sessionInput.trim()) return;
    const res = await updateServerSession(sessionInput);
    setSessionStatus(`${res.message} (${res.cookiePreview})`);
    loadBenchmark();
  };

  const handleParsePastedRsc = () => {
    setParseError(null);
    setParsedRscResult(null);

    if (!pastedRsc.trim()) {
      setParseError('Please paste RSC response text from Chrome DevTools');
      return;
    }

    try {
      const direct = JSON.parse(pastedRsc.trim());
      setParsedRscResult({ type: 'JSON Object', data: direct });
      return;
    } catch {}

    const lines = pastedRsc.split('\n');
    const parsedChunks: Record<string, any> = {};
    let found = false;

    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx > 0 && idx < 5) {
        const key = line.substring(0, idx);
        const payload = line.substring(idx + 1).trim();
        try {
          parsedChunks[key] = JSON.parse(payload);
          found = true;
        } catch {
          parsedChunks[key] = payload;
        }
      }
    }

    if (found) {
      setParsedRscResult({ type: 'Next.js RSC Chunks', data: parsedChunks });
    } else {
      setParseError('Could not decode JSON from pasted content. Ensure you copied the Response tab body.');
    }
  };

  if (!isOpen) return null;

  // Aggregate metrics across last 10 sessions
  const totalSessions = syncHistory.length;
  const avgSuccessRate =
    totalSessions > 0
      ? Math.round(syncHistory.reduce((acc, s) => acc + s.successRate, 0) / totalSessions)
      : 100;
  const totalBlockedAcrossSessions = syncHistory.reduce((acc, s) => acc + s.blockedCount, 0);
  const totalScrapedItems = syncHistory.reduce((acc, s) => acc + s.totalItems, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-6 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                India Post V3 Live Web Scraping &amp; Server Action Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Direct Next.js Server Actions: GET_PINCODE (7f04c7...) &amp; MASTER_DATA_MANAGEMENT (7f3430...)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status & Latency Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Target Government Server:
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  https://www.indiapost.gov.in/calculate-postage
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>
                  HTTP Status: <strong>{benchmark?.statusCode || 200}</strong>
                </span>
                <span>·</span>
                <span>
                  Latency:{' '}
                  <strong className="font-mono">
                    {benchmark?.latencyMs ? `${benchmark.latencyMs}ms` : 'Checking...'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Status: <strong className="font-mono">{benchmark?.serverHeader || 'Next.js'}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                loadBenchmark();
                loadSyncHistory();
              }}
              disabled={isLoadingBenchmark}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded transition-colors w-fit shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBenchmark ? 'animate-spin' : ''}`} />
              <span>Test Live Action</span>
            </button>
          </div>

          {/* Persistent Cache Import / Export */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  rates_cache_v3.json
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Backup or restore the server cache used by Offline mode.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={cacheFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleCacheImport}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cacheFileInputRef.current?.click()}
                  disabled={isImportingCache}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50 rounded transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isImportingCache ? 'Importing...' : 'Import JSON'}
                </button>
                <button
                  type="button"
                  onClick={downloadCacheExport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#c4122f] hover:bg-[#a60f26] rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>
            </div>
            {cacheStatus && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{cacheStatus}</p>
            )}
          </div>

          {/* Sync History Log Pane (Last 10 Batch Scraping Sessions) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#c4122f] dark:text-red-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Sync History — Last 10 Batch Scraping Sessions
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded">
                  {syncHistory.length} / 10
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSyncHistory}
                  disabled={isLoadingHistory}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                {syncHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSyncHistory}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Clear Sync History logs"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>
            </div>

            {/* Aggregate Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
              <div className="p-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Sessions Logged</span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-100">
                  {totalSessions}
                </span>
              </div>
              <div className="p-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Avg Success Rate</span>
                <span
                  className={`text-base font-bold font-mono ${
                    avgSuccessRate >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : avgSuccessRate >= 60
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {avgSuccessRate}%
                </span>
              </div>
              <div className="p-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Consignments Processed</span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-100">
                  {totalScrapedItems}
                </span>
              </div>
              <div className="p-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Blocked / WAF Requests</span>
                <span
                  className={`text-base font-bold font-mono ${
                    totalBlockedAcrossSessions > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {totalBlockedAcrossSessions}
                </span>
              </div>
            </div>

            {/* Session Rows */}
            {syncHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No batch scraping sessions recorded yet. Click <strong>Sync Live</strong> in the Bulk Spreadsheet toolbar to populate the session log.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {syncHistory.map((session, idx) => {
                  const isExpanded = expandedSessionId === session.sessionId;
                  const formattedTime = new Date(session.completedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={session.sessionId}
                      className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Left: Session ID, Origin, Time & Status Badge */}
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[11px] font-bold text-slate-400 w-5">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                                {session.sessionId}
                              </span>
                              {session.status === 'healthy' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{session.successRate}% Success</span>
                                </span>
                              )}
                              {session.status === 'partial_block' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{session.successRate}% Success ({session.blockedCount} Blocked)</span>
                                </span>
                              )}
                              {session.status === 'waf_blocked' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>WAF Blocked ({session.blockedCount} Failed)</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Origin {session.originPin} • {formattedTime} • {session.durationMs}ms
                            </div>
                          </div>
                        </div>

                        {/* Right: Item Breakdown Counters & Blocked Request Expand Button */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                            Total: <strong>{session.totalItems}</strong>
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 rounded text-blue-700 dark:text-blue-300">
                            Live: <strong>{session.liveCount}</strong>
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded text-emerald-700 dark:text-emerald-300">
                            Cached: <strong>{session.cachedCount}</strong>
                          </span>
                          {session.pinExceptionCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 rounded text-amber-700 dark:text-amber-300">
                              PIN Exc: <strong>{session.pinExceptionCount}</strong>
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              session.blockedCount > 0
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            Blocked: {session.blockedCount}
                          </span>

                          {session.blockedRequests && session.blockedRequests.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSessionId(isExpanded ? null : session.sessionId)
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded border border-rose-200 dark:border-rose-800 transition-colors"
                            >
                              <span>Inspect Blocked</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Success Rate Mini Bar */}
                      <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${session.successRate}%` }}
                          title={`Success Rate: ${session.successRate}%`}
                        />
                        {session.blockedCount > 0 && (
                          <div
                            className="h-full bg-rose-500 transition-all"
                            style={{
                              width: `${Math.min(
                                100 - session.successRate,
                                Math.round((session.blockedCount / Math.max(1, session.totalItems)) * 100)
                              )}%`,
                            }}
                            title={`Blocked Requests: ${session.blockedCount}`}
                          />
                        )}
                      </div>

                      {/* Expandable Blocked Request Details */}
                      {isExpanded && session.blockedRequests.length > 0 && (
                        <div className="mt-2.5 p-2.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 rounded-md space-y-1.5">
                          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                            <span>Blocked / Failed Portal Requests ({session.blockedRequests.length})</span>
                            <span className="font-normal text-[10px]">
                              Tip: Update AppTrana WAF cookies below if HTTP 403 / WAF challenge occurs
                            </span>
                          </div>
                          <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                            {session.blockedRequests.map((req, rIdx) => (
                              <div
                                key={`${req.itemId}-${rIdx}`}
                                className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 bg-white dark:bg-slate-900 rounded border border-rose-100 dark:border-rose-900/50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {req.route}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-500">{req.service}</span>
                                </div>
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                  {req.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test Live Multi-Service Action Query */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-[#c4122f]" />
              <span>Run Live All-Service Server Action Spot-Check</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">From PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={testOriginPin}
                  onChange={(e) => setTestOriginPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">To PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={testDestPin}
                  onChange={(e) => setTestDestPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Article Type</label>
                <select
                  value={testArticleType}
                  onChange={(e) => setTestArticleType(e.target.value as 'Letter' | 'Parcel')}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value="Letter">Letter (Speed Post, Letter Card, Letter, Postcard)</option>
                  <option value="Parcel">Parcel (Speed Post Parcel, Contractual, Retail)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Weight (g)</label>
                <input
                  type="number"
                  value={testWeight}
                  onChange={(e) => setTestWeight(parseInt(e.target.value) || 50)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={runLiveTest}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#c4122f] hover:bg-[#a60f26] disabled:opacity-50 rounded transition-colors shadow-xs"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isTesting ? 'Scraping All Services...' : 'Scrape All Services Live'}</span>
            </button>

            {testResult && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {testResult.isLive ? 'Live Response from indiapost.gov.in' : 'Error / Fallback'}
                  </span>
                  <span className="font-mono text-slate-500">{testResult.latencyMs}ms</span>
                </div>
                {testResult.originMeta && testResult.destMeta && (
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                    Origin: <strong>{testResult.originMeta.office} ({testResult.originMeta.city})</strong> → Dest:{' '}
                    <strong>{testResult.destMeta.office} ({testResult.destMeta.city})</strong> | Distance:{' '}
                    <strong>{testResult.distanceKm ?? 0} km</strong>
                  </div>
                )}
                {testResult.services && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {Object.entries(testResult.services).map(([k, v]: [string, any]) => (
                      <div
                        key={k}
                        className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                      >
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          {v.serviceName || k}
                        </div>
                        <div className="text-sm font-extrabold font-mono text-[#c4122f] mt-0.5">
                          Rs {Number(v.totalPostage || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Base: ₹{Number(v.basePostage || 0).toFixed(2)} | GST: ₹{Number(v.gstAmount || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AppTrana WAF Session Cookie / cURL Importer */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>AppTrana WAF Session Cookie / cURL Updater</span>
            </h4>
            <p className="text-xs text-slate-500">
              If India Post&apos;s firewall challenges requests, paste a browser <code className="font-mono">Cookie</code>{' '}
              header or <code className="font-mono">Copy as cURL (bash)</code> command from DevTools to update the
              backend session.
            </p>
            <textarea
              rows={2}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="Paste cURL command or cookie string (e.g. cookieConsent=...; asdasdasda=...; sess_map=...)"
              className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveSession}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 rounded transition-colors"
              >
                Update Active Session Cookies
              </button>
              {sessionStatus && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  {sessionStatus}
                </span>
              )}
            </div>
          </div>

          {/* DevTools RSC Response Body Calibrator */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>DevTools Next.js RSC Response Decoder</span>
            </h4>
            <textarea
              rows={2}
              value={pastedRsc}
              onChange={(e) => setPastedRsc(e.target.value)}
              placeholder='e.g. 1:{"success":true,"data":{"base_tariff":59,"gst":10,"total_with_tax":69}}'
              className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleParsePastedRsc}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded transition-colors"
              >
                Decode RSC Payload
              </button>
            </div>
            {parseError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
                {parseError}
              </div>
            )}
            {parsedRscResult && (
              <div className="p-3 bg-slate-900 text-slate-100 rounded-md text-xs font-mono overflow-x-auto max-h-40">
                <pre>{JSON.stringify(parsedRscResult.data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
