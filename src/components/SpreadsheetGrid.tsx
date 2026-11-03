import React, { useState, useMemo } from 'react';
import { ConsignmentItem } from '../types/consignment';
import { POSTAL_SERVICES, ServiceType } from '../data/indiaPostTariffs';
import { INTERNATIONAL_COUNTRIES } from '../data/postalCircles';
import {
  Copy,
  Trash2,
  SlidersHorizontal,
  AlertTriangle,
  Globe,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface SpreadsheetGridProps {
  items: ConsignmentItem[];
  originPin: string;
  onUpdateItem: (id: string, updates: Partial<ConsignmentItem>) => void;
  onDuplicateItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenCompareModal: (item: ConsignmentItem) => void;
  onSyncSingleRow?: (id: string) => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  items,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  onOpenCompareModal,
  onSyncSingleRow,
}) => {
  // Pagination & Filtering state (default 200 rows per page for smooth 1000+ item performance)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(200);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.referenceId.toLowerCase().includes(q) ||
        item.recipientName.toLowerCase().includes(q) ||
        item.destinationPin.includes(q) ||
        item.serviceType.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const totalItems = filteredItems.length;
  const isAll = pageSize === 0;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = isAll ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = isAll ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const visibleItems = isAll ? filteredItems : filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(target);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-slate-800 text-[#c4122f] dark:text-red-400 flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Consignments Added</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
          Add items manually using the spreadsheet inputs, import your existing dispatch CSV/Excel sheet, or use the V3 Multi-PIN Runner.
        </p>
      </div>
    );
  }

  // Generate numbered page buttons (e.g. 1, 2, 3 ... 10)
  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => handlePageChange(p)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            p === safeCurrentPage
              ? 'bg-[#c4122f] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {p}
        </button>
      ));
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);
    if (safeCurrentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);

    return pages.map((p, idx) =>
      p === 'ellipsis' ? (
        <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
          …
        </span>
      ) : (
        <button
          key={p}
          type="button"
          onClick={() => handlePageChange(p)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            p === safeCurrentPage
              ? 'bg-[#c4122f] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {p}
        </button>
      )
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      {/* Top Pagination & Filter Toolbar */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Record Range & Count */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-[#c4122f]" />
            <span>
              Showing <strong className="font-mono text-slate-900 dark:text-white">{totalItems === 0 ? 0 : (startIndex + 1).toLocaleString()}–{endIndex.toLocaleString()}</strong> of <strong className="font-mono text-[#c4122f] dark:text-red-400">{totalItems.toLocaleString()}</strong> records
            </span>
          </div>
          {filteredItems.length < items.length && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              (Filtered from {items.length.toLocaleString()})
            </span>
          )}
        </div>

        {/* Center: Search Filter */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Consignee, Ref ID, or PIN..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:border-[#c4122f] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Page Size & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-xs">Per Page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
              className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:border-[#c4122f]"
            >
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows (Default)</option>
              <option value={500}>500 rows</option>
              <option value={0}>All ({items.length})</option>
            </select>
          </div>

          {!isAll && totalPages > 1 && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safeCurrentPage === 1}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1730px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3 px-3 w-14 text-center">#</th>
              <th className="py-3 px-3.5 w-48 min-w-[175px]">Ref ID</th>
              <th className="py-3 px-3.5 w-60 min-w-[200px]">Consignee</th>
              <th className="py-3 px-3.5 w-56 min-w-[200px]">Destination</th>
              <th className="py-3 px-3.5 w-80 min-w-[290px]">Service</th>
              <th className="py-3 px-3.5 w-36 min-w-[125px] text-right">Weight (g)</th>
              <th className="py-3 px-3.5 w-48 min-w-[180px] text-center">Dim (L×W×H cm)</th>
              <th className="py-3 px-3.5 text-right w-28 min-w-[105px]">Base (₹)</th>
              <th className="py-3 px-3.5 text-right w-24 min-w-[95px]">GST (₹)</th>
              <th className="py-3 px-3.5 text-center w-28 min-w-[115px]" title="Proof of Delivery (+₹11.80 including GST)">
                POD (₹11.80)
              </th>
              <th className="py-3 px-3.5 text-right w-36 min-w-[140px]">Total (₹)</th>
              <th className="py-3 px-3.5 w-32 min-w-[125px] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {visibleItems.map((item, index) => {
              const calc = item.calculation;
              const isEligible = calc.isEligible;
              const source = calc.dataSource;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors ${
                    !isEligible || source === 'pin_exception' ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                  }`}
                >
                  {/* S.No */}
                  <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">{startIndex + index + 1}</td>

                  {/* Ref ID */}
                  <td className="py-3 px-3.5">
                    <input
                      type="text"
                      value={item.referenceId}
                      onChange={(e) => onUpdateItem(item.id, { referenceId: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-md transition-colors shadow-2xs tracking-tight"
                      placeholder="e.g. JN927363207IN"
                    />
                  </td>

                  {/* Consignee */}
                  <td className="py-3 px-3.5">
                    <input
                      type="text"
                      value={item.recipientName}
                      onChange={(e) => onUpdateItem(item.id, { recipientName: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-md transition-colors shadow-2xs"
                      placeholder="Consignee Name"
                    />
                  </td>

                  {/* Destination */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextType = item.destinationType === 'domestic' ? 'international' : 'domestic';
                          const defaultService = nextType === 'international' ? 'intl_ems' : 'speed_post';
                          onUpdateItem(item.id, {
                            destinationType: nextType,
                            serviceType: defaultService,
                          });
                        }}
                        className={`p-1.5 rounded shrink-0 transition-colors ${
                          item.destinationType === 'international'
                            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={`Switch Domestic/International (Current: ${item.destinationType})`}
                      >
                        {item.destinationType === 'international' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      </button>

                      {item.destinationType === 'domestic' ? (
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            maxLength={6}
                            value={item.destinationPin}
                            onChange={(e) =>
                              onUpdateItem(item.id, {
                                destinationPin: e.target.value.replace(/\D/g, '').slice(0, 6),
                              })
                            }
                            className="w-24 px-2 py-1.5 text-xs font-mono font-bold tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f] shadow-2xs"
                            placeholder="PIN"
                          />
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1" title={calc.circleInfo}>
                            {source === 'pin_exception' ? (
                              <span className="text-amber-700 dark:text-amber-400 font-bold">PINCODE NOT FOUND</span>
                            ) : (
                              calc.circleInfo || 'Enter 6-digit PIN'
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <select
                            value={item.destinationCountry}
                            onChange={(e) => onUpdateItem(item.id, { destinationCountry: e.target.value })}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium truncate shadow-2xs"
                          >
                            {INTERNATIONAL_COUNTRIES.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.code} - {country.name}
                              </option>
                            ))}
                          </select>
                          <div className="text-[11px] text-slate-500 truncate mt-1">{calc.distanceSlab}</div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Service */}
                  <td className="py-3 px-3.5">
                    <select
                      value={item.serviceType}
                      onChange={(e) => onUpdateItem(item.id, { serviceType: e.target.value as ServiceType })}
                      className="w-full text-xs py-1.5 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-800 dark:text-slate-100 focus:border-[#c4122f] focus:ring-1 focus:ring-[#c4122f] shadow-2xs cursor-pointer"
                    >
                      {item.destinationType === 'domestic' ? (
                        <>
                          <optgroup label="India Post Parcels & Express">
                            <option value="speed_post">Speed Post Parcel / Doc [speed_post]</option>
                            <option value="business_parcel">India Post Parcel (Contractual) [business_parcel]</option>
                            <option value="registered_parcel">India Post Parcel (Retail) [registered_parcel]</option>
                            <option value="registered_letter">Registered Letter / Doc [registered_letter]</option>
                          </optgroup>
                          <optgroup label="Letters & Cards (Standard Post)">
                            <option value="letter">Ordinary Letter [letter]</option>
                            <option value="letter_card">Letter Card (Inland Letter) [letter_card]</option>
                            <option value="postcard">Postcard [postcard]</option>
                          </optgroup>
                          <optgroup label="Commercial Cargo & Freight">
                            <option value="logistics_post">Logistics Post (Heavy &gt;50kg)</option>
                          </optgroup>
                          <optgroup label="Educational">
                            <option value="printed_books">Printed Books (Concessional)</option>
                            <option value="book_packet">Book Packet & Periodicals</option>
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <option value="intl_ems">International EMS (Speed Post)</option>
                          <option value="intl_air_parcel">International Air Parcel</option>
                          <option value="intl_small_packet">Intl Small Packet (&lt;2kg)</option>
                        </>
                      )}
                    </select>
                    <div className="flex items-center gap-2 mt-1">
                      {item.destinationType === 'domestic' && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {calc.distanceKm.toLocaleString('en-IN')} km ·{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{calc.distanceSlab}</span>
                        </span>
                      )}
                      {source === 'live_indiapost_portal' && (
                        <span className="text-[10px] font-mono font-bold text-[#1565c0] dark:text-blue-400">
                          [FRESH LIVE]
                        </span>
                      )}
                      {source === 'cached_portal' && (
                        <span className="text-[10px] font-mono font-bold text-[#2e7d32] dark:text-emerald-400">
                          [CACHED]
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Weight (grams) */}
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={item.weightGrams}
                        onChange={(e) => onUpdateItem(item.id, { weightGrams: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-20 px-2 py-1.5 text-xs font-mono text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white shadow-2xs"
                      />
                      <span className="text-xs text-slate-400 font-mono">g</span>
                    </div>
                    {item.weightGrams >= 1000 && (
                      <div className="text-[11px] text-slate-500 font-mono mt-1">{(item.weightGrams / 1000).toFixed(2)} kg</div>
                    )}
                  </td>

                  {/* Dimensions (L x W x H cm) */}
                  <td className="py-3 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                      <input
                        type="number"
                        placeholder="L"
                        min={0}
                        value={item.lengthCm || ''}
                        onChange={(e) => onUpdateItem(item.id, { lengthCm: parseFloat(e.target.value) || undefined })}
                        className="w-11 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold"
                        title="Length in cm"
                      />
                      <span className="text-slate-400 font-bold">×</span>
                      <input
                        type="number"
                        placeholder="W"
                        min={0}
                        value={item.widthCm || ''}
                        onChange={(e) => onUpdateItem(item.id, { widthCm: parseFloat(e.target.value) || undefined })}
                        className="w-11 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold"
                        title="Width in cm"
                      />
                      <span className="text-slate-400 font-bold">×</span>
                      <input
                        type="number"
                        placeholder="H"
                        min={0}
                        value={item.heightCm || ''}
                        onChange={(e) => onUpdateItem(item.id, { heightCm: parseFloat(e.target.value) || undefined })}
                        className="w-11 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold"
                        title="Height in cm"
                      />
                    </div>
                    {calc.volumetricWeightGrams && calc.volumetricWeightGrams > item.weightGrams ? (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-1" title="Charged by volumetric weight">
                        Vol: {calc.volumetricWeightGrams}g
                      </div>
                    ) : null}
                    {calc.dimensionWarning && (
                      <div className="text-[11px] text-rose-500 font-medium truncate mt-1" title={calc.dimensionWarning}>
                        &lt;14×9×1cm
                      </div>
                    )}
                  </td>

                  {/* Base Postage */}
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                    {isEligible && source !== 'pin_exception' ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.manualBaseOverride ?? calc.basePostage.toFixed(2)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onUpdateItem(item.id, { manualBaseOverride: isNaN(val) ? undefined : val });
                          }}
                          className="w-20 px-1.5 py-1 text-xs font-mono font-bold text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                          title="Click to override base postage"
                        />
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* GST */}
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {isEligible && source !== 'pin_exception'
                      ? (() => {
                          const base = item.manualBaseOverride ?? calc.basePostage;
                          const total = item.manualTotalOverride ?? calc.totalPostage;
                          const gst =
                            item.manualTotalOverride !== undefined
                              ? Math.max(0, total - base - calc.registrationFee - calc.valueAddedServicesFee)
                              : calc.gstAmount;
                          return gst > 0 ? `₹${gst.toFixed(2)}` : 'Nil';
                        })()
                      : '—'}
                  </td>

                  {/* Proof of Delivery (POD +₹11.80 incl. GST) */}
                  <td className="py-3 px-3.5 text-center">
                    <label
                      className="inline-flex items-center justify-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Proof of Delivery (+₹11.80 including GST)"
                    >
                      <input
                        type="checkbox"
                        checked={item.hasAck}
                        onChange={(e) => onUpdateItem(item.id, { hasAck: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#c4122f] focus:ring-[#c4122f] cursor-pointer"
                      />
                      <span
                        className={`font-mono tabular-nums text-xs ${
                          item.hasAck
                            ? 'font-bold text-amber-700 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.hasAck ? '₹11.80' : '—'}
                      </span>
                    </label>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-3.5 text-right">
                    {source === 'pin_exception' ? (
                      <span className="font-mono font-bold text-[#9c4221] dark:text-amber-400 text-[11px]">
                        PIN NOT FOUND
                      </span>
                    ) : isEligible ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[#c4122f] font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.manualTotalOverride ?? calc.totalPostage.toFixed(2)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onUpdateItem(item.id, { manualTotalOverride: isNaN(val) ? undefined : val });
                          }}
                          className={`w-24 px-1.5 py-1 text-xs font-mono tabular-nums font-bold text-right border rounded-md shadow-2xs ${
                            source === 'live_indiapost_portal'
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-[#1565c0] dark:text-blue-300'
                              : source === 'cached_portal'
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-[#2e7d32] dark:text-emerald-300'
                              : 'bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-[#c4122f] dark:text-red-400'
                          }`}
                          title="Live scraped or overridden total postage"
                        />
                      </div>
                    ) : (
                      <div
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400"
                        title={calc.ineligibilityReason}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Ineligible</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onSyncSingleRow && item.destinationType === 'domestic' && (
                        <button
                          type="button"
                          onClick={() => onSyncSingleRow(item.id)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                          title="Scrape this row live from indiapost.gov.in"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenCompareModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Compare all India Post service rates for this parcel"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Duplicate row"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete consignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      {!isAll && totalPages > 1 && (
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Summary */}
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            Page <strong className="text-slate-900 dark:text-white font-mono">{safeCurrentPage}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong> (
            <span className="font-mono">{(startIndex + 1).toLocaleString()}–{endIndex.toLocaleString()}</span> of{' '}
            <span className="font-mono">{totalItems.toLocaleString()}</span> items)
          </div>

          {/* Center: Numbered Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 mx-1">
              {renderPageNumbers()}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              Next
            </button>
          </div>

          {/* Right: Quick Jump */}
          <form onSubmit={handleJumpPage} className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Go to page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={String(safeCurrentPage)}
              className="w-14 px-2 py-1 text-xs text-center font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
