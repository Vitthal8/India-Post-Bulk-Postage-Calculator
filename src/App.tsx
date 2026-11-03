/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Navbar } from './components/Navbar';
import { BatchHeaderControls } from './components/BatchHeaderControls';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { BatchSummaryCard } from './components/BatchSummaryCard';
import { CompareServicesModal } from './components/CompareServicesModal';
import { ImportCSVModal } from './components/ImportCSVModal';
import { PrintableManifestModal } from './components/PrintableManifestModal';
import { SingleParcelEstimator } from './components/SingleParcelEstimator';
import { TariffExplorer } from './components/TariffExplorer';
import { PostalCirclesExplorer } from './components/PostalCirclesExplorer';
import { LivePortalInspector } from './components/LivePortalInspector';

import { ConsignmentItem, BatchSummary } from './types/consignment';
import { ServiceType, computePostageForService, TariffVersion, POSTAL_SERVICES, POD_FEE_INCL_GST } from './data/indiaPostTariffs';
import { SAMPLE_PRESETS } from './data/sampleBatches';
import { exportConsignmentsToCSV, downloadFile } from './utils/csvHandler';
import {
  fetchBatchLiveTariffs,
  LiveTariffResponse,
} from './services/indiaPostApi';

export default function App() {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'single' | 'tariffs' | 'circles'>('spreadsheet');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [originPin, setOriginPin] = useState<string>('400703');
  const [tariffVersion, setTariffVersion] = useState<TariffVersion>('2025_revised');

  // Load initial sample batch
  const [items, setItems] = useState<ConsignmentItem[]>(() => {
    return SAMPLE_PRESETS[0].generateItems();
  });

  // Live Scraping State (Defaults to Exact 18% Counter GST)
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{
    completed: number;
    total: number;
    cached: number;
    live: number;
    exceptions: number;
    errors: number;
    currentTask?: string;
  }>({
    completed: 0,
    total: 0,
    cached: 0,
    live: 0,
    exceptions: 0,
    errors: 0,
  });

  const stopSyncRef = useRef<boolean>(false);
  const initialSyncDoneRef = useRef<boolean>(false);

  // Modals state
  const [compareItem, setCompareItem] = useState<ConsignmentItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isPrintManifestOpen, setIsPrintManifestOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Sync dark theme on root html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Helper to apply a LiveTariffResponse onto a ConsignmentItem (Exact 18% Counter GST default)
  const applyLiveResultToItem = useCallback((item: ConsignmentItem, res: LiveTariffResponse): ConsignmentItem => {
    if (res.source === 'pin_exception') {
      return {
        ...item,
        calculation: {
          ...item.calculation,
          basePostage: 0,
          gstAmount: 0,
          totalPostage: 0,
          circleInfo: res.error || 'PINCODE NOT FOUND',
          dataSource: 'pin_exception',
          errorMessage: res.error,
        },
      };
    }

    if (!res.isLive || res.totalPostage <= 0) {
      return item;
    }

    const base = res.basePostage;
    // Always default to Exact 18% Counter GST when GST applies
    const useExact = res.exactTotalPostage !== undefined && res.exactTotalPostage > 0 && res.gstAmount > 0;
    const gst = useExact ? res.exactGstAmount! : res.gstAmount;
    const postageTotal = useExact ? res.exactTotalPostage! : res.totalPostage;
    const podFee = item.hasAck ? POD_FEE_INCL_GST : 0;
    const total = Math.round((postageTotal + podFee) * 100) / 100;

    const distanceKm = res.distanceKm !== undefined ? res.distanceKm : item.calculation.distanceKm;
    const distanceSlab =
      res.isLocal === true
        ? 'Local'
        : res.distanceKm !== undefined
        ? res.distanceKm <= 200
          ? '1-200 km'
          : res.distanceKm <= 500
          ? '201-500 km'
          : res.distanceKm <= 1000
          ? '501-1000 km'
          : res.distanceKm <= 2000
          ? '1001-2000 km'
          : '>2000 km'
        : item.calculation.distanceSlab;

    return {
      ...item,
      calculation: {
        ...item.calculation,
        basePostage: base,
        gstAmount: gst,
        valueAddedServicesFee: podFee,
        subtotal: base,
        totalPostage: total,
        distanceKm,
        distanceSlab,
        circleInfo: res.toCity ? `${res.toCity}` : item.calculation.circleInfo,
        dataSource: res.source,
      },
    };
  }, []);

  // Batch Live Scraper across given items
  const syncItemsLive = useCallback(
    async (targetItems: ConsignmentItem[], forceRefresh: boolean = false, currentOriginPin: string = originPin) => {
      const domesticItems = targetItems.filter((i) => i.destinationType === 'domestic');
      if (domesticItems.length === 0) return;

      stopSyncRef.current = false;
      setIsSyncingLive(true);

      let completed = 0;
      let cachedCount = 0;
      let liveCount = 0;
      let exceptionCount = 0;
      let errorCount = 0;
      const total = domesticItems.length;

      setSyncProgress({
        completed: 0,
        total,
        cached: 0,
        live: 0,
        exceptions: 0,
        errors: 0,
        currentTask: 'Starting live scrape...',
      });

      const BATCH_SIZE = 6;
      const sessionId = `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      for (let i = 0; i < domesticItems.length; i += BATCH_SIZE) {
        if (stopSyncRef.current) break;

        const batchSlice = domesticItems.slice(i, i + BATCH_SIZE);
        const first = batchSlice[0];
        setSyncProgress((prev) => ({
          ...prev,
          currentTask: `${currentOriginPin} → ${first.destinationPin} (${first.weightGrams}g)`,
        }));

        try {
          const payload = batchSlice.map((item) => ({
            id: item.id,
            originPin: (item as any).customOriginPin || currentOriginPin,
            destPin: item.destinationPin,
            weightGrams: item.weightGrams,
            serviceType: item.serviceType,
            lengthCm: item.lengthCm,
            widthCm: item.widthCm,
            heightCm: item.heightCm,
            forceRefresh,
            retryOnce: true,
          }));

          const { results } = await fetchBatchLiveTariffs(payload, sessionId);

          Object.values(results).forEach((r) => {
            completed += 1;
            if (r.source === 'cached_portal') cachedCount += 1;
            else if (r.source === 'live_indiapost_portal') liveCount += 1;
            else if (r.source === 'pin_exception') exceptionCount += 1;
            else errorCount += 1;
          });

          setItems((prev) =>
            prev.map((row) => {
              const res = results[row.id];
              if (!res) return row;
              return applyLiveResultToItem(row, res);
            })
          );

          setSyncProgress({
            completed,
            total,
            cached: cachedCount,
            live: liveCount,
            exceptions: exceptionCount,
            errors: errorCount,
            currentTask: `${currentOriginPin} → ${batchSlice[batchSlice.length - 1].destinationPin}`,
          });
        } catch {
          completed += batchSlice.length;
          errorCount += batchSlice.length;
          setSyncProgress({
            completed,
            total,
            cached: cachedCount,
            live: liveCount,
            exceptions: exceptionCount,
            errors: errorCount,
          });
        }
      }

      setIsSyncingLive(false);
    },
    [originPin, applyLiveResultToItem]
  );

  // Auto-sync initial sample batch on first mount
  useEffect(() => {
    if (!initialSyncDoneRef.current && items.length > 0) {
      initialSyncDoneRef.current = true;
      syncItemsLive(items, false, originPin);
    }
  }, [items, originPin, syncItemsLive]);

  // Recalculate consignments when origin PIN changes
  useEffect(() => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const calc = computePostageForService(
          item.serviceType,
          item.weightGrams,
          originPin,
          item.destinationPin,
          item.destinationCountry,
          item.lengthCm,
          item.widthCm,
          item.heightCm,
          item.hasAck,
          tariffVersion
        );
        return { ...item, calculation: calc };
      })
    );
  }, [originPin, tariffVersion]);

  // Calculate Batch Summary Aggregates
  const summary: BatchSummary = useMemo(() => {
    let totalItems = items.length;
    let eligibleItems = 0;
    let ineligibleItems = 0;
    let totalWeightKg = 0;
    let totalBasePostage = 0;
    let totalRegistrationFee = 0;
    let totalGst = 0;
    let grandTotal = 0;
    const serviceCounts: Record<string, number> = {};

    items.forEach((item) => {
      const c = item.calculation;
      totalWeightKg += item.weightGrams / 1000;
      serviceCounts[item.serviceType] = (serviceCounts[item.serviceType] || 0) + 1;

      if (c.isEligible && c.dataSource !== 'pin_exception') {
        eligibleItems += 1;
        const base = item.manualBaseOverride ?? c.basePostage;
        const total = item.manualTotalOverride ?? c.totalPostage;
        const gst =
          item.manualTotalOverride !== undefined
            ? Math.max(0, item.manualTotalOverride - base - c.registrationFee - c.valueAddedServicesFee)
            : c.gstAmount;

        totalBasePostage += base;
        totalRegistrationFee += c.registrationFee + c.valueAddedServicesFee;
        totalGst += gst;
        grandTotal += total;
      } else {
        ineligibleItems += 1;
      }
    });

    return {
      totalItems,
      eligibleItems,
      ineligibleItems,
      totalWeightKg,
      totalBasePostage: Math.round(totalBasePostage * 100) / 100,
      totalRegistrationFee: Math.round(totalRegistrationFee * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      serviceCounts,
    };
  }, [items]);

  // Consignment Operations
  const handleUpdateItem = (id: string, updates: Partial<ConsignmentItem>) => {
    let updatedTarget: ConsignmentItem | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated: ConsignmentItem = { ...item, ...updates };

        // If only POD (hasAck) or text fields changed and we already have live/cached portal rates, preserve live Base & GST
        const isOnlyAckOrMeta =
          updates.destinationPin === undefined &&
          updates.weightGrams === undefined &&
          updates.serviceType === undefined &&
          updates.lengthCm === undefined &&
          updates.widthCm === undefined &&
          updates.heightCm === undefined &&
          updates.destinationType === undefined &&
          updates.destinationCountry === undefined;

        if (
          isOnlyAckOrMeta &&
          (item.calculation.dataSource === 'live_indiapost_portal' || item.calculation.dataSource === 'cached_portal')
        ) {
          const podFee = updated.hasAck ? POD_FEE_INCL_GST : 0;
          const newTotal =
            Math.round(
              (item.calculation.basePostage +
                item.calculation.registrationFee +
                item.calculation.gstAmount +
                podFee) *
                100
            ) / 100;
          updatedTarget = {
            ...updated,
            calculation: {
              ...item.calculation,
              valueAddedServicesFee: podFee,
              totalPostage: newTotal,
            },
          };
          return updatedTarget;
        }

        const calc = computePostageForService(
          updated.serviceType,
          updated.weightGrams,
          originPin,
          updated.destinationPin,
          updated.destinationCountry,
          updated.lengthCm,
          updated.widthCm,
          updated.heightCm,
          updated.hasAck,
          tariffVersion
        );
        updatedTarget = { ...updated, calculation: calc };
        return updatedTarget;
      })
    );

    if (
      updatedTarget &&
      (updates.destinationPin !== undefined ||
        updates.weightGrams !== undefined ||
        updates.serviceType !== undefined ||
        updates.lengthCm !== undefined ||
        updates.widthCm !== undefined ||
        updates.heightCm !== undefined)
    ) {
      const target = updatedTarget as ConsignmentItem;
      if (target.destinationType === 'domestic' && target.destinationPin.length === 6) {
        syncItemsLive([target], false, originPin);
      }
    }
  };

  // Batch toggle Proof of Delivery (+₹11.80 incl. GST) across all rows
  const handleToggleAllPod = (enabled: boolean) => {
    setItems((prev) =>
      prev.map((item) => {
        const podFee = enabled ? POD_FEE_INCL_GST : 0;
        const c = item.calculation;
        if (c.dataSource === 'pin_exception' || !c.isEligible) {
          return { ...item, hasAck: enabled };
        }
        const newTotal =
          Math.round((c.basePostage + c.registrationFee + c.gstAmount + podFee) * 100) / 100;
        return {
          ...item,
          hasAck: enabled,
          calculation: {
            ...c,
            valueAddedServicesFee: podFee,
            totalPostage: newTotal,
          },
        };
      })
    );
  };

  const allPodEnabled = items.length > 0 && items.every((i) => i.hasAck);

  const handleSyncSingleRow = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) {
      syncItemsLive([target], true, originPin);
    }
  };

  const handleDuplicateItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const clone: ConsignmentItem = {
      ...target,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      referenceId: `${target.referenceId || 'COPY'}-C`,
    };

    const targetIdx = items.findIndex((i) => i.id === id);
    const newItems = [...items];
    newItems.splice(targetIdx + 1, 0, clone);
    setItems(newItems);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddRow = () => {
    const newItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const calc = computePostageForService(
      'speed_post',
      75,
      originPin,
      '411048',
      'IN',
      undefined,
      undefined,
      undefined,
      false,
      tariffVersion
    );
    const newItem: ConsignmentItem = {
      id: newItemId,
      referenceId: `PKG-${100 + items.length + 1}`,
      recipientName: 'Consignee',
      destinationType: 'domestic',
      destinationPin: '411048',
      destinationCountry: 'IN',
      serviceType: 'speed_post',
      weightGrams: 75,
      hasAck: false,
      calculation: calc,
    };
    setItems((prev) => [...prev, newItem]);
    syncItemsLive([newItem], false, originPin);
  };

  const handleBulkApplyService = (service: ServiceType) => {
    const updatedList = items.map((item) => {
      const isIntlService = service.startsWith('intl_');
      const nextDestType: 'domestic' | 'international' = isIntlService ? 'international' : 'domestic';
      const calc = computePostageForService(
        service,
        item.weightGrams,
        originPin,
        item.destinationPin,
        item.destinationCountry,
        item.lengthCm,
        item.widthCm,
        item.heightCm,
        item.hasAck,
        tariffVersion
      );
      return {
        ...item,
        serviceType: service,
        destinationType: nextDestType,
        calculation: calc,
      };
    });
    setItems(updatedList);
    syncItemsLive(updatedList, false, originPin);
  };

  // Excel (.xlsx) Exporter
  const handleExportExcelFile = () => {
    if (items.length === 0) return;
    const exportRows = items.map((item, idx) => {
      const c = item.calculation;
      const base = item.manualBaseOverride ?? c.basePostage;
      const total = item.manualTotalOverride ?? c.totalPostage;
      const gst =
        item.manualTotalOverride !== undefined
          ? Math.max(0, total - base - c.registrationFee - c.valueAddedServicesFee)
          : c.gstAmount;

      return {
        'S.No': idx + 1,
        'From': (item as any).customOriginPin || originPin,
        'To': item.destinationPin,
        'Weight': `${item.weightGrams}g`,
        'Service': POSTAL_SERVICES[item.serviceType]?.name || item.serviceType,
        'Base Tariff (Rs)': Number(base.toFixed(2)),
        'GST 18% (Rs)': Number(gst.toFixed(2)),
        'POD (Rs 11.80)': item.hasAck ? POD_FEE_INCL_GST : 0,
        'Total Price (Rs)': c.dataSource === 'pin_exception' ? 'PINCODE NOT FOUND' : Number(total.toFixed(2)),
        'Distance (km)': c.distanceKm,
        'Distance Slab': c.distanceSlab,
        'Ref ID': item.referenceId,
        'Consignee': item.recipientName,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'India Post Rates');
    XLSX.writeFile(workbook, `india_post_rates_${Date.now()}.xlsx`);
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const csvContent = exportConsignmentsToCSV(items, originPin);
    downloadFile(csvContent, `india_post_bulk_dispatch_${Date.now()}.csv`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-red-100 selection:text-red-900">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        itemCount={items.length}
        onPrintManifest={() => setIsPrintManifestOpen(true)}
        onExportCSV={handleExportCSV}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1850px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'spreadsheet' && (
          <div>
            {/* Streamlined Origin PIN & Toolbar */}
            <BatchHeaderControls
              originPin={originPin}
              setOriginPin={setOriginPin}
              onAddRow={handleAddRow}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onExportExcelFile={handleExportExcelFile}
              onBulkApplyService={handleBulkApplyService}
              onClearTable={() => setItems([])}
              itemCount={items.length}
              isSyncingLive={isSyncingLive}
              syncProgress={syncProgress}
              onSyncAllLive={(force) => syncItemsLive(items, Boolean(force), originPin)}
              onStopSync={() => {
                stopSyncRef.current = true;
              }}
              allPodEnabled={allPodEnabled}
              onToggleAllPod={handleToggleAllPod}
            />

            {/* High-Density Spreadsheet Table */}
            <SpreadsheetGrid
              items={items}
              originPin={originPin}
              onUpdateItem={handleUpdateItem}
              onDuplicateItem={handleDuplicateItem}
              onDeleteItem={handleDeleteItem}
              onOpenCompareModal={(item) => setCompareItem(item)}
              onSyncSingleRow={handleSyncSingleRow}
            />

            {/* Batch Aggregates & Financial Card */}
            {items.length > 0 && (
              <BatchSummaryCard
                summary={summary}
                onExportCSV={handleExportCSV}
                onPrintManifest={() => setIsPrintManifestOpen(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'single' && (
          <SingleParcelEstimator
            originPin={originPin}
            setOriginPin={setOriginPin}
            onAddConsignmentToBatch={(item) => {
              setItems((prev) => [...prev, item]);
              setActiveTab('spreadsheet');
            }}
          />
        )}

        {activeTab === 'tariffs' && (
          <TariffExplorer
            tariffVersion={tariffVersion}
            setTariffVersion={setTariffVersion}
          />
        )}

        {activeTab === 'circles' && <PostalCirclesExplorer />}
      </main>

      {/* Modals */}
      <CompareServicesModal
        item={compareItem}
        originPin={originPin}
        onClose={() => setCompareItem(null)}
        onSelectService={(itemId, newService) => {
          handleUpdateItem(itemId, { serviceType: newService });
        }}
      />

      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        originPin={originPin}
        onImportSuccess={(newItems) => {
          setItems((prev) => {
            const combined = [...prev, ...newItems];
            syncItemsLive(newItems, false, originPin);
            return combined;
          });
        }}
      />

      <PrintableManifestModal
        isOpen={isPrintManifestOpen}
        onClose={() => setIsPrintManifestOpen(false)}
        items={items}
        summary={summary}
        originPin={originPin}
      />

      <LivePortalInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        originPin={originPin}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span>India Post Bulk Postage Calculator</span>
            <span className="mx-2">·</span>
            <span className="font-mono">
              Live Online Scraping • Exact 18% Counter GST Default
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Live Scraping & Session Inspector
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tariffs')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Tariff Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('circles')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Postal Circles
            </button>
            <a
              href="https://www.indiapost.gov.in/calculate-postage"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#c4122f] dark:hover:text-red-400 font-medium transition-colors"
            >
              Official DoP Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
