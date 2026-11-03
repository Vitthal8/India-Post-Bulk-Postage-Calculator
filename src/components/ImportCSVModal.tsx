import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { parseCSV, generateTemplateCSV, downloadFile } from '../utils/csvHandler';
import { ConsignmentItem } from '../types/consignment';
import { ServiceType, computePostageForService } from '../data/indiaPostTariffs';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  originPin: string;
  onImportSuccess: (items: ConsignmentItem[]) => void;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  originPin,
  onImportSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedItems, setParsedItems] = useState<ConsignmentItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.xlsm');
    const isCsv = lower.endsWith('.csv') || file.type === 'text/csv';

    if (!isExcel && !isCsv) {
      setPreviewError('Please upload a valid .csv or .xlsx / .xls Excel file.');
      return;
    }

    setFileName(file.name);
    setPreviewError(null);

    if (isExcel) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        const generated: ConsignmentItem[] = [];
        rows.forEach((r, idx) => {
          const fromVal = String(r['From'] || r['from'] || r['Origin'] || r['From Pincode'] || originPin)
            .replace(/\.0$/, '')
            .replace(/\D/g, '')
            .slice(0, 6);
          const toVal = String(
            r['To'] ||
              r['to'] ||
              r['Destination PIN'] ||
              r['Pincode'] ||
              r['PIN'] ||
              r['Dest PIN'] ||
              r['dest_pin'] ||
              ''
          )
            .replace(/\.0$/, '')
            .replace(/\D/g, '')
            .slice(0, 6);
          const weightVal = parseInt(
            String(r['Weight'] || r['weight'] || r['Weight (g)'] || r['Weight(g)'] || r['weight_grams'] || '50').replace(
              /\.0$/,
              ''
            ),
            10
          );

          if (!toVal) return;

          const refVal = String(r['Barcode'] || r['Ref ID'] || r['Reference'] || r['reference_id'] || `ROW-${idx + 1}`).trim();
          const nameVal = String(r['Consignee'] || r['Name'] || r['City'] || r['recipient_name'] || `PIN ${toVal}`).trim();
          const serviceRaw = String(r['Service'] || r['service'] || r['article_type'] || 'speed_post').toLowerCase();

          let srv: ServiceType = 'speed_post';
          if (serviceRaw.includes('letter card') || serviceRaw.includes('letter_card')) srv = 'letter_card';
          else if (serviceRaw.includes('postcard')) srv = 'postcard';
          else if (serviceRaw === 'letter' || serviceRaw.includes('ordinary letter')) srv = 'letter';
          else if (serviceRaw.includes('business') || serviceRaw.includes('contractual')) srv = 'business_parcel';
          else if (serviceRaw.includes('retail') || serviceRaw.includes('registered parcel') || serviceRaw.includes('registered_parcel'))
            srv = 'registered_parcel';

          const cleanWeight = !isNaN(weightVal) && weightVal > 0 ? weightVal : 50;
          const calc = computePostageForService(srv, cleanWeight, fromVal || originPin, toVal, 'IN');

          const item: ConsignmentItem & { customOriginPin?: string } = {
            id: `xl-${Date.now()}-${idx}`,
            referenceId: refVal,
            recipientName: nameVal,
            destinationType: 'domestic',
            destinationPin: toVal,
            destinationCountry: 'IN',
            serviceType: srv,
            weightGrams: cleanWeight,
            hasAck: false,
            calculation: calc,
            customOriginPin: fromVal || originPin,
          };
          generated.push(item);
        });

        if (generated.length === 0) {
          setPreviewError('No valid rows with destination PIN found in Excel file.');
          setParsedCount(null);
          setParsedItems([]);
        } else {
          setParsedItems(generated);
          setParsedCount(generated.length);
        }
      } catch {
        setPreviewError('Failed to parse Excel workbook.');
        setParsedCount(null);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = parseCSV(content, originPin);
      if (res.items.length === 0) {
        setPreviewError(res.errors[0] || 'No valid consignments found in CSV.');
        setParsedCount(null);
        setParsedItems([]);
      } else {
        setParsedItems(res.items);
        setParsedCount(res.items.length);
        if (res.errors.length > 0) {
          setPreviewError(`Parsed ${res.items.length} items with ${res.errors.length} minor warnings.`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = () => {
    if (parsedItems.length > 0) {
      onImportSuccess(parsedItems);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-red-50 dark:bg-slate-800 text-[#c4122f] dark:text-red-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Consignments (CSV / Excel)</h3>
              <p className="text-xs text-slate-500">Batch upload shipping manifest & auto-scrape live rates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-[#c4122f] bg-red-50/30 dark:bg-slate-800/80'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : 'Drag & drop your CSV or Excel (.xlsx/.xls) file here, or click to browse'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports standard CSV or Excel sheets with From, To / Pincode, and Weight columns
            </p>
          </div>

          {/* Status / Feedback */}
          {parsedCount !== null && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-md text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Ready to import and live-scrape <strong>{parsedCount}</strong> consignment rows.
              </span>
            </div>
          )}

          {previewError && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-md text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Template helper */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Need the standard spreadsheet format?</span>
            <button
              type="button"
              onClick={() => {
                const template = generateTemplateCSV();
                downloadFile(template, 'india_post_bulk_template.csv');
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#c4122f] dark:text-red-400 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template CSV</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!parsedCount}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#c4122f] hover:bg-[#a60f26] disabled:opacity-50 disabled:pointer-events-none rounded-md transition-colors shadow-xs"
          >
            Import {parsedCount ? `${parsedCount} Items` : 'Items'}
          </button>
        </div>
      </div>
    </div>
  );
};
