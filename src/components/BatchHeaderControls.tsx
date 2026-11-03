import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Square,
} from 'lucide-react';
import { validatePinCode } from '../data/postalCircles';
import { POSTAL_SERVICES, ServiceType } from '../data/indiaPostTariffs';

interface BatchHeaderControlsProps {
  originPin: string;
  setOriginPin: (pin: string) => void;
  onAddRow: () => void;
  onOpenImportModal: () => void;
  onExportExcelFile: () => void;
  onBulkApplyService: (service: ServiceType) => void;
  onClearTable: () => void;
  itemCount: number;
  isSyncingLive: boolean;
  syncProgress: {
    completed: number;
    total: number;
    cached: number;
    live: number;
    exceptions: number;
    errors: number;
    currentTask?: string;
  };
  onSyncAllLive: (forceRefresh?: boolean) => void;
  onStopSync: () => void;
  allPodEnabled: boolean;
  onToggleAllPod: (enabled: boolean) => void;
}

export const BatchHeaderControls: React.FC<BatchHeaderControlsProps> = ({
  originPin,
  setOriginPin,
  onAddRow,
  onOpenImportModal,
  onExportExcelFile,
  onBulkApplyService,
  onClearTable,
  itemCount,
  isSyncingLive,
  syncProgress,
  onSyncAllLive,
  onStopSync,
  allPodEnabled,
  onToggleAllPod,
}) => {
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const originValidation = validatePinCode(originPin);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs mb-5 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Origin Post Office PIN Configuration */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-red-50 dark:bg-slate-800 flex items-center justify-center text-[#c4122f] dark:text-red-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="origin-pin-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Origin PIN Code (Sender Post Office)
              </label>
              {originValidation.isValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  6 Digits Required
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="origin-pin-input"
                type="text"
                maxLength={6}
                value={originPin}
                onChange={(e) => setOriginPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 400703"
                className="w-28 px-2.5 py-1 text-sm font-mono font-semibold tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-[#c4122f] focus:border-[#c4122f]"
              />
              {originValidation.isValid && originValidation.circleInfo && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">{originValidation.circleInfo.circleName}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-500 dark:text-slate-400">{originValidation.circleInfo.headquarters}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Streamlined Action Controls: Sync Live, Add Item, Import, Export, POD Toggle, Bulk Service */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync Live / Stop Scrape */}
          {!isSyncingLive ? (
            <button
              type="button"
              onClick={() => onSyncAllLive(false)}
              disabled={itemCount === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-md transition-colors shadow-xs"
              title="Fetch live rates from indiapost.gov.in for all rows"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Live</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopSync}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Scrape</span>
            </button>
          )}

          {/* Add Item */}
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#c4122f] hover:bg-[#a60f26] rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>

          {/* Import */}
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={onExportExcelFile}
            disabled={itemCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-md transition-colors"
            title="Export results to Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Batch Proof of Delivery (POD +₹11.80 incl. GST) Toggle */}
          {itemCount > 0 && (
            <label
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border cursor-pointer select-none transition-colors ${
                allPodEnabled
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Apply Proof of Delivery (+₹11.80 including GST) to all rows"
            >
              <input
                type="checkbox"
                checked={allPodEnabled}
                onChange={(e) => onToggleAllPod(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#c4122f] focus:ring-[#c4122f] cursor-pointer"
              />
              <span>POD (+₹11.80)</span>
            </label>
          )}

          {/* Bulk Service Dropdown */}
          {itemCount > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <span>Bulk Service</span>
              </button>

              {showBulkMenu && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 max-h-72 overflow-y-auto"
                  onMouseLeave={() => setShowBulkMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Apply to all {itemCount} items
                  </div>
                  {Object.values(POSTAL_SERVICES).map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        onBulkApplyService(service.id);
                        setShowBulkMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <div className="font-medium">{service.name}</div>
                      <div className="text-[10px] text-slate-400">{service.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clear Table */}
          {itemCount > 0 && (
            <button
              type="button"
              onClick={onClearTable}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Clear all rows"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Progress Status Bar when Scraping */}
      {(isSyncingLive || syncProgress.total > 0) && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <span>
              {isSyncingLive
                ? `Scraping ${syncProgress.completed}/${syncProgress.total} | ${syncProgress.live} live | ${syncProgress.cached} cached | ${syncProgress.exceptions} exceptions ${
                    syncProgress.currentTask ? `| ${syncProgress.currentTask}` : ''
                  }`
                : `Synced ${syncProgress.completed} items (${syncProgress.live} live, ${syncProgress.cached} cached${
                    syncProgress.exceptions > 0 ? `, ${syncProgress.exceptions} pin exceptions` : ''
                  }) • Exact 18% Counter GST Active`}
            </span>
            <span className="font-bold">
              {syncProgress.total > 0 ? Math.round((syncProgress.completed / syncProgress.total) * 100) : 0}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-200"
              style={{
                width: `${
                  syncProgress.total > 0 ? Math.min(100, (syncProgress.completed / syncProgress.total) * 100) : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
