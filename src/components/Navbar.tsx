import React from 'react';
import { Mail, Sun, Moon, Printer, Download, Wifi, WifiOff } from 'lucide-react';
import { CalculatorMode } from '../services/indiaPostApi';

interface NavbarProps {
  activeTab: 'spreadsheet' | 'single' | 'tariffs' | 'circles';
  setActiveTab: (tab: 'spreadsheet' | 'single' | 'tariffs' | 'circles') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  itemCount: number;
  onPrintManifest: () => void;
  onExportCSV: () => void;
  onOpenInspector: () => void;
  calculatorMode: CalculatorMode;
  setCalculatorMode: (mode: CalculatorMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  itemCount,
  onPrintManifest,
  onExportCSV,
  onOpenInspector,
  calculatorMode,
  setCalculatorMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-md bg-[#c4122f] flex items-center justify-center text-white shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
                India Post <span className="text-[#c4122f] dark:text-red-400">Postage Engine</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Live Online Tariff & Bulk Dispatch Calculator
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('spreadsheet')}
              className={`pb-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'spreadsheet'
                  ? 'text-[#c4122f] dark:text-red-400 border-b-2 border-[#c4122f] dark:border-red-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bulk Spreadsheet{' '}
              {itemCount > 0 && <span className="text-xs font-mono ml-1 text-slate-400">({itemCount})</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`pb-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'single'
                  ? 'text-[#c4122f] dark:text-red-400 border-b-2 border-[#c4122f] dark:border-red-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Single Parcel Estimator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tariffs')}
              className={`pb-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'tariffs'
                  ? 'text-[#c4122f] dark:text-red-400 border-b-2 border-[#c4122f] dark:border-red-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tariff Schedules
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('circles')}
              className={`pb-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'circles'
                  ? 'text-[#c4122f] dark:text-red-400 border-b-2 border-[#c4122f] dark:border-red-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Postal Circles & PINs
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setCalculatorMode('offline')}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded ${
                  calculatorMode === 'offline'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Use rates_cache_v3.json and local tariff calculations without network requests"
              >
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </button>
              <button
                type="button"
                onClick={() => setCalculatorMode('online')}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded ${
                  calculatorMode === 'online'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Use cached rates first, then query the India Post portal"
              >
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">Online</span>
              </button>
            </div>
            {/* Live Inspector Button */}
            <button
              type="button"
              onClick={onOpenInspector}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-md border border-emerald-200/80 dark:border-slate-700 transition-colors"
              title="Open India Post Web Scraping & Cache Inspector"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden md:inline">Live Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Theme"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {itemCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                  title="Export consignments to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={onPrintManifest}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#c4122f] hover:bg-[#a60f26] rounded-md transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Manifest</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="lg:hidden flex items-center justify-between border-t border-slate-100 dark:border-slate-800 py-2 overflow-x-auto text-xs gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('spreadsheet')}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              activeTab === 'spreadsheet'
                ? 'bg-red-50 text-[#c4122f] font-semibold dark:bg-slate-800 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Spreadsheet ({itemCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              activeTab === 'single'
                ? 'bg-red-50 text-[#c4122f] font-semibold dark:bg-slate-800 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Estimator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tariffs')}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              activeTab === 'tariffs'
                ? 'bg-red-50 text-[#c4122f] font-semibold dark:bg-slate-800 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Tariffs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('circles')}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              activeTab === 'circles'
                ? 'bg-red-50 text-[#c4122f] font-semibold dark:bg-slate-800 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Circles
          </button>
        </div>
      </div>
    </header>
  );
};
