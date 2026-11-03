import React from 'react';
import { ConsignmentItem, BatchSummary } from '../types/consignment';
import { PostalCircleInfo, validatePinCode } from '../data/postalCircles';
import { X, Printer } from 'lucide-react';

interface PrintableManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ConsignmentItem[];
  summary: BatchSummary;
  originPin: string;
}

export const PrintableManifestModal: React.FC<PrintableManifestModalProps> = ({
  isOpen,
  onClose,
  items,
  summary,
  originPin,
}) => {
  if (!isOpen) return null;

  const originCircle = validatePinCode(originPin).circleInfo;
  const manifestId = `IP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-lg shadow-2xl max-w-4xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Toolbar (Hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Postal Dispatch Manifest Preview</span>
            <span className="text-xs text-slate-400 font-mono">({items.length} consignments)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#c4122f] hover:bg-[#a60f26] rounded transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Sheet Body */}
        <div className="p-8 overflow-y-auto print-sheet text-slate-900 font-['Public_Sans',sans-serif]">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-extrabold tracking-tight uppercase text-[#c4122f]">
                  DEPARTMENT OF POSTS · INDIA POST
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mt-0.5">
                  Bulk Mailer Dispatch Manifest & Counter Booking Voucher
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Origin Circle: <strong>{originCircle?.circleName || 'General Post Office'}</strong> · Booking Hub: {originPin}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-800">
                  MANIFEST NO: <span className="text-[#c4122f]">{manifestId}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">DATE: {currentDate}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">SYSTEM GENERATED</div>
              </div>
            </div>
          </div>

          {/* Consignor / Sender Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs mb-5">
            <div>
              <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">
                Consignor / Sender Information:
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">Corporate / Bulk Mail Dispatcher</p>
              <p className="text-slate-600">Origin Post Office PIN: <strong>{originPin}</strong> ({originCircle?.headquarters})</p>
            </div>
            <div>
              <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">
                Booking Counter Summary:
              </span>
              <p className="text-slate-700 mt-0.5">
                Total Articles: <strong>{summary.totalItems}</strong> | Gross Mass: <strong>{summary.totalWeightKg.toFixed(2)} kg</strong>
              </p>
              <p className="text-slate-700">
                Postage: ₹{summary.totalBasePostage.toFixed(2)} | GST: ₹{summary.totalGst.toFixed(2)} | Net: <strong>₹{summary.grandTotal.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          {/* Consignments Table */}
          <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] uppercase">
                <th className="border border-slate-300 py-2 px-2 text-center w-8">#</th>
                <th className="border border-slate-300 py-2 px-2 w-24">Article Ref</th>
                <th className="border border-slate-300 py-2 px-2">Consignee & Destination</th>
                <th className="border border-slate-300 py-2 px-2 w-32">Service</th>
                <th className="border border-slate-300 py-2 px-2 text-right w-16">Weight</th>
                <th className="border border-slate-300 py-2 px-2 text-right w-20">Postage (₹)</th>
                <th className="border border-slate-300 py-2 px-2 text-right w-16">GST (₹)</th>
                <th className="border border-slate-300 py-2 px-2 text-right w-20">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const c = item.calculation;
                return (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-[11px] text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono font-semibold text-slate-800">
                      {item.referenceId || `ITEM-${idx + 1}`}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2">
                      <div className="font-medium text-slate-800">{item.recipientName || 'Unspecified'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.destinationType === 'domestic'
                          ? `PIN: ${item.destinationPin} (${c.circleInfo})`
                          : `Country: ${item.destinationCountry} (${c.distanceSlab})`}
                      </div>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 font-medium">
                      {c.serviceName}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">
                      {c.chargeableWeightGrams}g
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">
                      ₹{(c.basePostage + c.registrationFee + c.valueAddedServicesFee).toFixed(2)}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-600">
                      {c.gstAmount > 0 ? `₹${c.gstAmount.toFixed(2)}` : 'Nil'}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                      ₹{c.totalPostage.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="border border-slate-300 py-2 px-3 text-right uppercase text-[11px]">
                  Batch Totals ({summary.totalItems} articles):
                </td>
                <td className="border border-slate-300 py-2 px-2 text-right font-mono">
                  {summary.totalWeightKg.toFixed(2)}kg
                </td>
                <td className="border border-slate-300 py-2 px-2 text-right font-mono">
                  ₹{(summary.totalBasePostage + summary.totalRegistrationFee).toFixed(2)}
                </td>
                <td className="border border-slate-300 py-2 px-2 text-right font-mono">
                  ₹{summary.totalGst.toFixed(2)}
                </td>
                <td className="border border-slate-300 py-2 px-2 text-right font-mono text-sm text-[#c4122f]">
                  ₹{summary.grandTotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Declarations & Postal Officer Signoff Block */}
          <div className="grid grid-cols-2 gap-8 pt-4 mt-6 border-t border-slate-300 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                Consignor Declaration:
              </p>
              <p className="text-[11px] leading-relaxed">
                Certified that the above articles contain no contraband, dangerous, or restricted goods prohibited under the Indian Post Office Act, 1898.
              </p>
              <div className="mt-8 border-t border-slate-400 pt-1 text-[11px] font-semibold text-slate-700">
                Signature of Authorized Dispatcher / Company Seal
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                Postal Booking Counter Acknowledgment:
              </p>
              <p className="text-[11px] leading-relaxed">
                Received above articles in good condition with postage amount collected / charged to bulk franking account.
              </p>
              <div className="mt-8 border-t border-slate-400 pt-1 flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Postal Clerk Signature & Date</span>
                <span>Counter Date Stamp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
