import React from 'react';
import { ConsignmentItem } from '../types/consignment';
import { compareAllServices, PostageCalculationResult, ServiceType, POSTAL_SERVICES } from '../data/indiaPostTariffs';
import { X, Check, Clock, AlertCircle } from 'lucide-react';

interface CompareServicesModalProps {
  item: ConsignmentItem | null;
  originPin: string;
  onClose: () => void;
  onSelectService: (itemId: string, newService: ServiceType) => void;
}

export const CompareServicesModal: React.FC<CompareServicesModalProps> = ({
  item,
  originPin,
  onClose,
  onSelectService,
}) => {
  if (!item) return null;

  const comparisons = compareAllServices(
    item.weightGrams,
    originPin,
    item.destinationPin,
    item.destinationCountry,
    item.lengthCm,
    item.widthCm,
    item.heightCm
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Compare India Post Rates & Delivery
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consignment: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{item.referenceId || 'Item'}</span> · Weight: <span className="font-mono">{item.weightGrams}g</span>
              {item.destinationType === 'domestic' ? ` · Destination PIN: ${item.destinationPin}` : ` · Destination: ${item.destinationCountry}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-2">
                <th className="py-2 px-2">Service</th>
                <th className="py-2 px-2">Transit Window</th>
                <th className="py-2 px-2 text-right">Base</th>
                <th className="py-2 px-2 text-right">GST (18%)</th>
                <th className="py-2 px-2 text-right">Total Postage</th>
                <th className="py-2 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisons.map((c: PostageCalculationResult) => {
                const isSelected = item.serviceType === c.serviceId;
                const svc = POSTAL_SERVICES[c.serviceId];

                return (
                  <tr
                    key={c.serviceId}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-red-50/50 dark:bg-slate-800/60 font-medium' : ''
                    }`}
                  >
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{c.serviceName}</div>
                      <div className="text-[10px] text-slate-400">{svc?.category}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{svc?.deliveryTimeframe}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                      {c.isEligible ? `₹${(c.basePostage + c.registrationFee + c.valueAddedServicesFee).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                      {c.isEligible ? (c.gstAmount > 0 ? `₹${c.gstAmount.toFixed(2)}` : 'Nil') : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {c.isEligible ? (
                        <span className="font-mono font-bold text-sm text-[#c4122f] dark:text-red-400">
                          ₹{c.totalPostage.toFixed(2)}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium"
                          title={c.ineligibilityReason}
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>Not Eligible</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-slate-800 rounded">
                          <Check className="w-3 h-3" />
                          Current
                        </span>
                      ) : c.isEligible ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectService(item.id, c.serviceId);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          Select
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Exceeds spec</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-slate-500 dark:text-slate-400">
            <strong>India Post Rule:</strong> Speed Post applies statutory 18% GST across all distance slabs. Ordinary Registered Parcel & Book Post are GST-exempt for registered educational mail.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
