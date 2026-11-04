import React, { useState, useEffect, useCallback } from 'react';
import {
  ServiceType,
  computePostageForService,
  PostageCalculationResult,
  POD_FEE_INCL_GST,
} from '../data/indiaPostTariffs';
import {
  INTERNATIONAL_COUNTRIES,
  validatePinCode,
  resolveDistanceSlab,
  getPinLocationName,
} from '../data/postalCircles';
import {
  Calculator,
  ArrowRight,
  ExternalLink,
  Star,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Search,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { ConsignmentItem } from '../types/consignment';
import {
  fetchAllLiveServices,
  ScrapeAllServicesResponse,
  LiveTariffResponse,
  CalculatorMode,
} from '../services/indiaPostApi';

interface SingleParcelEstimatorProps {
  originPin: string;
  setOriginPin: (pin: string) => void;
  onAddConsignmentToBatch: (item: ConsignmentItem) => void;
  calculatorMode: CalculatorMode;
}

export type ArticleType = 'Letter' | 'Parcel';

export const SingleParcelEstimator: React.FC<SingleParcelEstimatorProps> = ({
  originPin,
  setOriginPin,
  onAddConsignmentToBatch,
  calculatorMode,
}) => {
  const [activeTab, setActiveTab] = useState<'domestic' | 'international'>('domestic');
  const [articleType, setArticleType] = useState<ArticleType>('Letter');
  const [destPin, setDestPin] = useState<string>('411048');
  const [destCountry, setDestCountry] = useState<string>('US');

  // Package Details
  const [weightGrams, setWeightGrams] = useState<number>(75);
  const [lengthCm, setLengthCm] = useState<number>(14);
  const [widthCm, setWidthCm] = useState<number>(9);
  const [heightCm, setHeightCm] = useState<number>(1);
  const [hasPod, setHasPod] = useState<boolean>(false);

  // Live Scraping State
  const [isCalculated, setIsCalculated] = useState<boolean>(true);
  const [liveData, setLiveData] = useState<ScrapeAllServicesResponse | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [activeInfoTooltip, setActiveInfoTooltip] = useState<string | null>(null);

  const originValidation = validatePinCode(originPin);
  const destValidation = validatePinCode(destPin);
  const fallbackDistanceInfo = resolveDistanceSlab(originPin, destPin);

  // Merge live scraped PIN metadata with local fallback
  const originLocName = liveData?.originMeta?.city || getPinLocationName(originPin);
  const destLocName = liveData?.destMeta?.city || getPinLocationName(destPin);
  const originOfficeName = liveData?.originMeta?.office
    ? `${liveData.originMeta.office} (${liveData.originMeta.state})`
    : originValidation.circleInfo
    ? `${originValidation.circleInfo.circleName} (${originValidation.circleInfo.state})`
    : '';
  const destOfficeName = liveData?.destMeta?.office
    ? `${liveData.destMeta.office} (${liveData.destMeta.state})`
    : destValidation.circleInfo
    ? `${destValidation.circleInfo.circleName} (${destValidation.circleInfo.state})`
    : '';

  const effectiveDistanceKm =
    liveData?.distanceKm !== undefined ? liveData.distanceKm : fallbackDistanceInfo.distanceKm;
  const effectiveSlab =
    liveData?.isLocal === true
      ? 'Local'
      : liveData?.distanceKm !== undefined
      ? liveData.distanceKm <= 200
        ? '1-200 km'
        : liveData.distanceKm <= 500
        ? '201-500 km'
        : liveData.distanceKm <= 1000
        ? '501-1000 km'
        : liveData.distanceKm <= 2000
        ? '1001-2000 km'
        : '>2000 km'
      : fallbackDistanceInfo.slab;

  // Trigger parallel live scraping from indiapost.gov.in
  const runLiveScrape = useCallback(
    async (forceRefresh: boolean = false) => {
      if (activeTab !== 'domestic') return;
      if (originPin.length !== 6 || destPin.length !== 6 || weightGrams <= 0) return;

      setIsFetchingLive(true);
      try {
        const res = await fetchAllLiveServices({
          originPin,
          destPin,
          weightGrams,
          articleType,
          lengthCm: articleType === 'Parcel' ? lengthCm : undefined,
          widthCm: articleType === 'Parcel' ? widthCm : undefined,
          heightCm: articleType === 'Parcel' ? heightCm : undefined,
          forceRefresh,
          mode: calculatorMode,
        });
        setLiveData(res);
      } catch {
        // Keep fallback if network error
      } finally {
        setIsFetchingLive(false);
      }
    },
    [activeTab, originPin, destPin, weightGrams, articleType, lengthCm, widthCm, heightCm, calculatorMode]
  );

  // Auto-scrape with debounce when inputs change
  useEffect(() => {
    if (originPin.length === 6 && destPin.length === 6 && weightGrams > 0) {
      const timer = setTimeout(() => {
        runLiveScrape(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [originPin, destPin, weightGrams, articleType, lengthCm, widthCm, heightCm, runLiveScrape]);

  // Helper to apply live scraped response onto a calculation result (defaults to Exact 18% Counter GST + optional POD)
  const applyLiveOverride = (
    baseCalc: PostageCalculationResult,
    liveRes?: LiveTariffResponse,
    includePod: boolean = false
  ): PostageCalculationResult => {
    const podFee = includePod ? POD_FEE_INCL_GST : 0;
    if (!liveRes || !liveRes.isLive || liveRes.totalPostage <= 0) {
      return baseCalc;
    }
    const useExact = liveRes.exactTotalPostage !== undefined && liveRes.exactTotalPostage > 0 && liveRes.gstAmount > 0;
    const effectiveGst = useExact ? liveRes.exactGstAmount! : liveRes.gstAmount;
    const effectiveTotal = useExact ? liveRes.exactTotalPostage! : liveRes.totalPostage;

    return {
      ...baseCalc,
      basePostage: liveRes.basePostage,
      gstAmount: effectiveGst,
      valueAddedServicesFee: podFee,
      subtotal: liveRes.basePostage,
      totalPostage: Math.round((effectiveTotal + podFee) * 100) / 100,
      distanceKm: liveRes.distanceKm !== undefined ? liveRes.distanceKm : baseCalc.distanceKm,
      distanceSlab:
        liveRes.isLocal === true
          ? 'Local'
          : liveRes.distanceKm !== undefined
          ? effectiveSlab
          : baseCalc.distanceSlab,
      circleInfo: liveData?.destMeta
        ? `${liveData.destMeta.city} (${liveData.destMeta.office})`
        : baseCalc.circleInfo,
      dataSource: liveRes.source,
    };
  };

  // Parcel Services (Live + Fallback)
  const speedPostParcelCalc = applyLiveOverride(
    computePostageForService(
      'speed_post',
      weightGrams,
      originPin,
      destPin,
      destCountry,
      lengthCm,
      widthCm,
      heightCm,
      hasPod
    ),
    liveData?.services?.speed_post_parcel,
    hasPod
  );

  const contractualCalc = applyLiveOverride(
    computePostageForService(
      'business_parcel',
      weightGrams,
      originPin,
      destPin,
      destCountry,
      lengthCm,
      widthCm,
      heightCm,
      hasPod
    ),
    liveData?.services?.business_parcel,
    hasPod
  );

  const retailCalc = applyLiveOverride(
    computePostageForService(
      'registered_parcel',
      weightGrams,
      originPin,
      destPin,
      destCountry,
      lengthCm,
      widthCm,
      heightCm,
      hasPod
    ),
    liveData?.services?.registered_parcel,
    hasPod
  );

  // Letter Services (Live + Fallback)
  const speedPostDocCalc = applyLiveOverride(
    computePostageForService('speed_post', weightGrams, originPin, destPin, destCountry, undefined, undefined, undefined, hasPod),
    liveData?.services?.speed_post_doc,
    hasPod
  );

  const letterCardCalc = applyLiveOverride(
    computePostageForService('letter_card', 5, originPin, destPin, destCountry),
    liveData?.services?.letter_card,
    false
  );

  const letterCalc = applyLiveOverride(
    computePostageForService('letter', weightGrams, originPin, destPin, destCountry),
    liveData?.services?.letter,
    false
  );

  const postcardCalc = applyLiveOverride(
    computePostageForService('postcard', 5, originPin, destPin, destCountry),
    liveData?.services?.postcard,
    false
  );

  // International calculations
  const intlEmsCalc = computePostageForService(
    'intl_ems',
    weightGrams,
    originPin,
    destPin,
    destCountry,
    lengthCm,
    widthCm,
    heightCm,
    hasPod
  );
  const intlAirParcelCalc = computePostageForService(
    'intl_air_parcel',
    weightGrams,
    originPin,
    destPin,
    destCountry,
    lengthCm,
    widthCm,
    heightCm,
    hasPod
  );
  const intlPacketCalc = computePostageForService(
    'intl_small_packet',
    weightGrams,
    originPin,
    destPin,
    destCountry,
    lengthCm,
    widthCm,
    heightCm,
    hasPod
  );

  const handleArticleTypeChange = (newType: ArticleType) => {
    setArticleType(newType);
    if (newType === 'Letter') {
      if (weightGrams > 500) setWeightGrams(75);
    } else if (newType === 'Parcel') {
      if (weightGrams < 500) setWeightGrams(1200);
    }
  };

  const handleCalculate = () => {
    setIsCalculated(true);
    runLiveScrape(true);
  };

  const handleReset = () => {
    if (articleType === 'Letter') {
      setWeightGrams(75);
    } else {
      setWeightGrams(1200);
      setLengthCm(14);
      setWidthCm(9);
      setHeightCm(1);
    }
    setDestPin('411048');
    setHasPod(false);
    setIsCalculated(true);
  };

  const handleAddToBatch = (serviceKey: ServiceType, name: string) => {
    let calc = speedPostParcelCalc;
    let actualWeight = weightGrams;

    if (serviceKey === 'speed_post' && articleType === 'Letter') {
      calc = speedPostDocCalc;
    } else if (serviceKey === 'business_parcel') {
      calc = contractualCalc;
    } else if (serviceKey === 'registered_parcel') {
      calc = retailCalc;
    } else if (serviceKey === 'letter') {
      calc = letterCalc;
    } else if (serviceKey === 'letter_card') {
      calc = letterCardCalc;
      actualWeight = 5;
    } else if (serviceKey === 'postcard') {
      calc = postcardCalc;
      actualWeight = 5;
    } else if (serviceKey === 'intl_ems') {
      calc = intlEmsCalc;
    } else if (serviceKey === 'intl_air_parcel') {
      calc = intlAirParcelCalc;
    } else if (serviceKey === 'intl_small_packet') {
      calc = intlPacketCalc;
    }

    const isPodEligibleService =
      serviceKey === 'speed_post' ||
      serviceKey === 'business_parcel' ||
      serviceKey === 'registered_parcel' ||
      serviceKey === 'registered_letter' ||
      serviceKey.startsWith('intl_');

    const newItem: ConsignmentItem = {
      id: `manual-${Date.now()}`,
      referenceId: `PKG-${Date.now().toString().slice(-4)}`,
      recipientName: `${destLocName} Consignee`,
      destinationType: activeTab,
      destinationPin: destPin,
      destinationCountry: destCountry,
      serviceType: serviceKey,
      weightGrams: actualWeight,
      lengthCm: articleType === 'Letter' ? undefined : lengthCm,
      widthCm: articleType === 'Letter' ? undefined : widthCm,
      heightCm: articleType === 'Letter' ? undefined : heightCm,
      hasAck: isPodEligibleService ? hasPod : false,
      calculation: calc,
    };

    onAddConsignmentToBatch(newItem);
    setAddedToast(name);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-5">
      {/* Toast Alert */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-emerald-600">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-semibold">{addedToast} added to Bulk Spreadsheet!</span>
        </div>
      )}

      {/* Main Official-Style Calculator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Header Navigation */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('domestic')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'domestic'
                  ? 'border-[#c4122f] text-[#c4122f] dark:text-red-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Domestic
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('international')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'international'
                  ? 'border-[#c4122f] text-[#c4122f] dark:text-red-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              International
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Scrape Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {isFetchingLive ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Scraping indiapost.gov.in...</span>
                </>
              ) : liveData?.isLive ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Portal Synced ({liveData.latencyMs}ms)</span>
                </>
              ) : (
                <span>Ready for Live Scrape</span>
              )}
            </div>

            <a
              href="https://www.indiapost.gov.in/calculate-postage"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded text-xs hover:underline"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Restricted & Prohibited Articles</span>
              <span className="underline font-semibold ml-1">Click here to know more</span>
            </a>
          </div>
        </div>

        {/* PIN Exception Alert if India Post reports Pincode Not Found */}
        {liveData?.pinException && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              PINCODE NOT FOUND on indiapost.gov.in: <strong className="font-mono">{liveData.pinException}</strong>
            </span>
          </div>
        )}

        {/* Input Form Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Select Article Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Article Type
                </label>
                <select
                  value={articleType}
                  onChange={(e) => handleArticleTypeChange(e.target.value as ArticleType)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-[#c4122f] focus:border-[#c4122f]"
                >
                  <option value="Letter">Letter</option>
                  <option value="Parcel">Parcel</option>
                </select>
              </div>

              {/* Origin and Destination Pincodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Origin Pincode or Location*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={originPin}
                      onChange={(e) => setOriginPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                      placeholder="e.g. 400703"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                      {originLocName}
                    </span>
                  </div>
                  {originOfficeName && (
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{originOfficeName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination {activeTab === 'domestic' ? 'Pincode or Location*' : 'Country*'}
                  </label>
                  {activeTab === 'domestic' ? (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          value={destPin}
                          onChange={(e) => setDestPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-3 py-2 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                          placeholder="e.g. 411048"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                          {destLocName}
                        </span>
                      </div>
                      {destOfficeName && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">{destOfficeName}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <select
                        value={destCountry}
                        onChange={(e) => setDestCountry(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                      >
                        {INTERNATIONAL_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.name} ({c.zone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Package Details */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Package Details
                </h3>

                {articleType === 'Letter' ? (
                  <div className="max-w-xs">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Weight (gms)*
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Max 0.5 kg for letters</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Weight (gms)*
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={35000}
                          value={weightGrams}
                          onChange={(e) => setWeightGrams(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">Max 35 kg</span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Length (cm)*
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={lengthCm}
                          onChange={(e) => setLengthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">Minimum 14 cm</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Width (cm)*
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={widthCm}
                          onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">Minimum 9 cm</span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Height (cm)*
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={heightCm}
                          onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 text-sm font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">Minimum 1 cm</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Value Added Service: Proof of Delivery (including GST) */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#c4122f] transition-colors">
                    <input
                      type="checkbox"
                      checked={hasPod}
                      onChange={(e) => setHasPod(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#c4122f] focus:ring-[#c4122f] cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        Proof of Delivery (including GST)
                      </span>
                      <span className="ml-2 font-mono font-bold text-[#c4122f] dark:text-amber-400">
                        +₹{POD_FEE_INCL_GST.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        Adds official Proof of Delivery fee (₹11.80 incl. 18% GST) to Speed Post &amp; Parcel services
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons: Calculate Postage & Reset */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isFetchingLive}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c4122f] hover:bg-[#a60f26] disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  {isFetchingLive ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                  <span>{isFetchingLive ? 'Scraping Live Rates...' : 'Calculate Postage'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Right Side: India Post Capsule & Live Portal Summary (5 Cols) */}
            <div className="lg:col-span-5 h-full flex flex-col justify-between">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#c4122f] to-[#7f0a1c] p-6 text-white shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                      Dak Ghar Official Live Engine
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
                    {liveData?.isLive ? 'LIVE SCRAPED' : '2025 Revised'}
                  </span>
                </div>

                <div className="my-3 space-y-2">
                  <h4 className="text-xl font-extrabold tracking-tight">भारतीय डाक • India Post</h4>
                  <p className="text-xs text-red-100 leading-relaxed">
                    Fetching live domestic tariffs, delivery Post Offices, and distance slabs directly from{' '}
                    <span className="underline font-mono">indiapost.gov.in/calculate-postage</span>.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-red-200 text-[10px] block">Distance Band:</span>
                    <span className="font-bold font-mono">{effectiveSlab}</span>
                  </div>
                  <div>
                    <span className="text-red-200 text-[10px] block">Official Portal Route:</span>
                    <span className="font-bold font-mono">{effectiveDistanceKm} km</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#c4122f] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      Direct India Post Server Action Sync:
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      All service cards below display the exact live rates returned by India Post&apos;s Next.js
                      Server Actions (<span className="font-mono">total_with_tax</span>). Click the info icon next to
                      any price to inspect Base Tariff and GST.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        {isCalculated && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 space-y-5">
            {/* Route Summary Bar */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                <span className="inline-flex items-center gap-1 text-[#c4122f] dark:text-red-400 font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  From: {originPin} ({originLocName})
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="inline-flex items-center gap-1 text-[#c4122f] dark:text-red-400 font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  To: {destPin} ({destLocName})
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Type: <strong className="text-slate-900 dark:text-white">{articleType}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Weight: <strong className="text-slate-900 dark:text-white font-mono">{weightGrams} gms</strong>
                </span>
              </div>
            </div>

            {/* Section Header: Available Shipping Services */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Available Shipping Services
                </h3>
                <span className="w-6 h-6 rounded-full bg-[#c4122f] text-white text-xs font-bold flex items-center justify-center font-mono">
                  {activeTab === 'domestic' ? (articleType === 'Letter' ? 4 : 3) : 3}
                </span>
              </div>

              <span className="text-xs text-slate-500 dark:text-slate-400">
                All statutory taxes (18% GST) computed per Department of Posts rules
              </span>
            </div>

            {/* Domestic Cards */}
            {activeTab === 'domestic' ? (
              articleType === 'Letter' ? (
                /* Official 4 Letter Services */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Speed Post Document (RECOMMENDED) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-[#c4122f] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#c4122f] flex items-center justify-center font-bold text-xs">
                            ⚡
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Speed Post</h4>
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-red-100 text-[#c4122f] dark:bg-red-950/60 dark:text-red-300 rounded">
                          RECOMMENDED
                        </span>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {speedPostDocCalc.totalPostage.toFixed(2)}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveInfoTooltip(activeInfoTooltip === 'sp_doc' ? null : 'sp_doc')}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="View Tariff Breakdown"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {activeInfoTooltip === 'sp_doc' && (
                              <div className="absolute z-20 left-0 bottom-6 w-56 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-[11px] space-y-1">
                                <div className="flex justify-between">
                                  <span>Base Tariff:</span>
                                  <span className="font-mono">₹{speedPostDocCalc.basePostage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Counter GST (18%):</span>
                                  <span className="font-mono">₹{speedPostDocCalc.gstAmount.toFixed(2)}</span>
                                </div>
                                {hasPod && (
                                  <div className="flex justify-between text-amber-300">
                                    <span>Proof of Delivery (incl. GST):</span>
                                    <span className="font-mono">+₹{POD_FEE_INCL_GST.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-slate-700 pt-1 font-bold text-amber-300">
                                  <span>Total Payable:</span>
                                  <span className="font-mono">₹{speedPostDocCalc.totalPostage.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">1-2 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                            {weightGrams}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5 text-[11px]">
                            4.8 <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Value Added Services Available</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('speed_post', 'Speed Post')}
                        className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Letter Card (LETTER_CARD_S) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-amber-500 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
                            ✉️
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Letter Card</h4>
                        </div>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {letterCardCalc.totalPostage.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">2-3 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px]">5</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5 text-[11px]">
                            4.5 <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] text-slate-400">
                        <span>No Value Added Services</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('letter_card', 'Letter Card')}
                        className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3. Ordinary Letter (LETTER) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-[#c4122f] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
                            ✉️
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Letter</h4>
                        </div>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {letterCalc.totalPostage.toFixed(2)}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveInfoTooltip(activeInfoTooltip === 'letter' ? null : 'letter')}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="View Tariff Breakdown"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {activeInfoTooltip === 'letter' && (
                              <div className="absolute z-20 left-0 bottom-6 w-48 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-[11px] space-y-1">
                                <div className="flex justify-between">
                                  <span>Base Postage:</span>
                                  <span className="font-mono">₹{letterCalc.basePostage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>GST:</span>
                                  <span className="font-mono">
                                    {letterCalc.gstAmount > 0 ? `₹${letterCalc.gstAmount.toFixed(2)}` : 'Nil'}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-slate-700 pt-1 font-bold text-amber-300">
                                  <span>Total:</span>
                                  <span className="font-mono">₹{letterCalc.totalPostage.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">3-4 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                            {weightGrams}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5 text-[11px]">
                            4.5 <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] text-slate-400">
                        <span>No Value Added Services</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('letter', 'Ordinary Letter')}
                        className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 4. Postcard (POSTCARD) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-amber-500 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
                            ✉️
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Postcard</h4>
                        </div>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {postcardCalc.totalPostage.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">3-5 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px]">5</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5 text-[11px]">
                            4.5 <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] text-slate-400">
                        <span>No Value Added Services</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('postcard', 'Postcard')}
                        className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Official 3 Parcel Services */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* 1. Speed Post Parcel (RECOMMENDED) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-[#c4122f] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#c4122f] flex items-center justify-center font-bold text-sm">
                            ⚡
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Speed Post</h4>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-red-100 text-[#c4122f] dark:bg-red-950/60 dark:text-red-300 rounded">
                          RECOMMENDED
                        </span>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {speedPostParcelCalc.totalPostage.toFixed(2)}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveInfoTooltip(activeInfoTooltip === 'sp' ? null : 'sp')}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="View Tariff Breakdown"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {activeInfoTooltip === 'sp' && (
                              <div className="absolute z-20 left-0 bottom-6 w-56 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-[11px] space-y-1">
                                <div className="flex justify-between">
                                  <span>Base Tariff:</span>
                                  <span className="font-mono">₹{speedPostParcelCalc.basePostage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Statutory GST (18%):</span>
                                  <span className="font-mono">₹{speedPostParcelCalc.gstAmount.toFixed(2)}</span>
                                </div>
                                {hasPod && (
                                  <div className="flex justify-between text-amber-300">
                                    <span>Proof of Delivery (incl. GST):</span>
                                    <span className="font-mono">+₹{POD_FEE_INCL_GST.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-slate-700 pt-1 font-bold text-amber-300">
                                  <span>Total:</span>
                                  <span className="font-mono">₹{speedPostParcelCalc.totalPostage.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">3-5 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{weightGrams}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5">
                            4.5 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Value Added Services Available</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('speed_post', 'Speed Post Parcel')}
                        className="w-full py-2.5 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. India Post Parcel (Contractual) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-amber-500 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-sm">
                            ✉️
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            India Post Parcel (Contractual)
                          </h4>
                        </div>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {contractualCalc.totalPostage.toFixed(2)}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveInfoTooltip(activeInfoTooltip === 'contractual' ? null : 'contractual')
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="View Tariff Breakdown"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {activeInfoTooltip === 'contractual' && (
                              <div className="absolute z-20 left-0 bottom-6 w-56 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-[11px] space-y-1">
                                <div className="flex justify-between">
                                  <span>Base Tariff:</span>
                                  <span className="font-mono">₹{contractualCalc.basePostage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Statutory GST:</span>
                                  <span className="font-mono">₹{contractualCalc.gstAmount.toFixed(2)}</span>
                                </div>
                                {hasPod && (
                                  <div className="flex justify-between text-amber-300">
                                    <span>Proof of Delivery (incl. GST):</span>
                                    <span className="font-mono">+₹{POD_FEE_INCL_GST.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-slate-700 pt-1 font-bold text-amber-300">
                                  <span>Total:</span>
                                  <span className="font-mono">₹{contractualCalc.totalPostage.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">3-5 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{weightGrams}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5">
                            4.5 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Value Added Services Available</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('business_parcel', 'India Post Parcel (Contractual)')}
                        className="w-full py-2.5 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3. India Post Parcel (Retail) */}
                  <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 border-t-amber-500 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-sm">
                            ✉️
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            India Post Parcel (Retail)
                          </h4>
                        </div>
                      </div>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f] dark:text-red-400">
                            ₹ {retailCalc.totalPostage.toFixed(2)}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveInfoTooltip(activeInfoTooltip === 'retail' ? null : 'retail')}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="View Tariff Breakdown"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {activeInfoTooltip === 'retail' && (
                              <div className="absolute z-20 left-0 bottom-6 w-56 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-[11px] space-y-1">
                                <div className="flex justify-between">
                                  <span>Base Tariff:</span>
                                  <span className="font-mono">₹{retailCalc.basePostage.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Statutory GST:</span>
                                  <span className="font-mono">₹{retailCalc.gstAmount.toFixed(2)}</span>
                                </div>
                                {hasPod && (
                                  <div className="flex justify-between text-amber-300">
                                    <span>Proof of Delivery (incl. GST):</span>
                                    <span className="font-mono">+₹{POD_FEE_INCL_GST.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-slate-700 pt-1 font-bold text-amber-300">
                                  <span>Total:</span>
                                  <span className="font-mono">₹{retailCalc.totalPostage.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-700/60 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">3-5 days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Weight (gms)</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{weightGrams}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Rating</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5">
                            4.5 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Value Added Services Available</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleAddToBatch('registered_parcel', 'India Post Parcel (Retail)')}
                        className="w-full py-2.5 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-[#c4122f] dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* International Cards */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-slate-800 border-2 border-[#c4122f] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        International EMS (Speed Post)
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-[#c4122f] rounded">
                        Fastest
                      </span>
                    </div>
                    <div className="my-4">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f]">
                        ₹ {intlEmsCalc.totalPostage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 py-2 border-y border-slate-100 dark:border-slate-700">
                      3 - 9 business days • Tracked with barcode
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToBatch('intl_ems', 'International EMS')}
                    className="w-full mt-4 py-2.5 bg-red-100 hover:bg-red-200 text-[#c4122f] font-bold text-xs rounded-lg"
                  >
                    Book Now / Add to Batch
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      International Air Parcel
                    </h4>
                    <div className="my-4">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f]">
                        ₹ {intlAirParcelCalc.totalPostage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 py-2 border-y border-slate-100 dark:border-slate-700">
                      7 - 14 business days • Standard commercial parcel
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToBatch('intl_air_parcel', 'International Air Parcel')}
                    className="w-full mt-4 py-2.5 bg-red-100 hover:bg-red-200 text-[#c4122f] font-bold text-xs rounded-lg"
                  >
                    Book Now / Add to Batch
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      International Small Packet
                    </h4>
                    <div className="my-4">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-[#c4122f]">
                        ₹ {intlPacketCalc.totalPostage.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 py-2 border-y border-slate-100 dark:border-slate-700">
                      8 - 18 business days • Economical under 2kg
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToBatch('intl_small_packet', 'International Small Packet')}
                    className="w-full mt-4 py-2.5 bg-red-100 hover:bg-red-200 text-[#c4122f] font-bold text-xs rounded-lg"
                  >
                    Book Now / Add to Batch
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Official Action: Locate Your Post Office */}
            <div className="pt-2">
              <a
                href="https://www.indiapost.gov.in/vas/pages/findpincode.aspx"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c4122f] hover:bg-[#a60f26] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Locate Your Post Office</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
