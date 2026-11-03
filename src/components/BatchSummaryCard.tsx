import React from 'react';
import { BatchSummary } from '../types/consignment';
import { Download, Printer, ShieldCheck, Info } from 'lucide-react';
import { POSTAL_SERVICES, ServiceType } from '../data/indiaPostTariffs';

interface BatchSummaryCardProps {
  summary: BatchSummary;
  onExportCSV: () => void;
  onPrintManifest: () => void;
}

export const BatchSummaryCard: React.FC<BatchSummaryCardProps> = ({
  summary,
  onExportCSV,
  onPrintManifest,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs mt-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Metric Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
          {/* Total Shipments */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Shipments
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {summary.totalItems}
              </span>
              <span className="text-[11px] text-slate-500">items</span>
            </div>
            {summary.ineligibleItems > 0 && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block mt-0.5">
                {summary.ineligibleItems} with weight limits
              </span>
            )}
          </div>

          {/* Total Weight */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Weight
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {summary.totalWeightKg.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Gross mass</span>
          </div>

          {/* Base Postage */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Base Postage
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{summary.totalBasePostage.toFixed(2)}
              </span>
            </div>
            {summary.totalRegistrationFee > 0 && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                + ₹{summary.totalRegistrationFee.toFixed(2)} POD / VAS
              </span>
            )}
          </div>

          {/* Total GST (18%) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              GST (18%)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{summary.totalGst.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Statutory tax</span>
          </div>

          {/* Grand Total */}
          <div className="p-3 bg-red-50/70 dark:bg-red-950/20 rounded-md border border-red-200/60 dark:border-red-900/40 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c4122f] dark:text-red-400 block">
              Grand Total
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold font-mono text-[#c4122f] dark:text-red-400">
                ₹{summary.grandTotal.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Total payable</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row lg:flex-col gap-2 shrink-0">
          <button
            onClick={onPrintManifest}
            disabled={summary.totalItems === 0}
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#c4122f] hover:bg-[#a60f26] disabled:opacity-50 disabled:pointer-events-none rounded-md transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dispatch Manifest</span>
          </button>

          <button
            onClick={onExportCSV}
            disabled={summary.totalItems === 0}
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Service Distribution Summary Bar */}
      {Object.keys(summary.serviceCounts).length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Services in batch:</span>
          {Object.entries(summary.serviceCounts).map(([svcId, count]) => {
            const svc = POSTAL_SERVICES[svcId as ServiceType];
            return (
              <span key={svcId} className="inline-flex items-center gap-1 font-mono">
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{count}×</span>
                <span className="text-slate-600 dark:text-slate-400">{svc ? svc.name : svcId}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
