import React from 'react';
import { useProperty } from '../context/PropertyContext';
import { 
  Building2, 
  Calendar, 
  RotateCcw, 
  FileSpreadsheet, 
  PlusCircle, 
  Settings as SettingsIcon,
  Zap,
  Wrench
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenBatchReadings: () => void;
  onOpenNewTicket: () => void;
  onOpenAddElectricity: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenBatchReadings,
  onOpenNewTicket,
  onOpenAddElectricity,
}) => {
  const { 
    buildings, 
    selectedBuildingId, 
    setSelectedBuildingId,
    selectedMonth,
    setSelectedMonth,
    resetToSampleData,
    exportToCSV,
    statements
  } = useProperty();

  const activeBuilding = buildings.find(b => b.id === selectedBuildingId);
  const currency = activeBuilding ? activeBuilding.currency : '₹';

  // Calculate quick stats for header bar
  const filteredStatements = selectedBuildingId === 'all'
    ? statements
    : statements.filter(s => s.buildingId === selectedBuildingId);

  const totalFlatsCount = filteredStatements.length;
  const pendingCollection = filteredStatements.reduce((acc, s) => acc + Math.max(0, s.balanceThisMonth), 0);

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-neutral-100 px-6 py-3.5 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Zone 1: Brand & Current Complex Context */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">EstateVolt</span>
              <span className="text-xs text-neutral-400 font-mono">
                {totalFlatsCount} Flats Active
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Multi-Building Utility & Lease Engine
            </p>
          </div>
        </div>

        {/* Zone 2: Building Selector & Month Selector */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center w-full md:w-auto">
          {/* Building Switcher */}
          <div className="flex items-center bg-neutral-800/90 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200">
            <Building2 className="w-3.5 h-3.5 mr-2 text-neutral-400" />
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="bg-transparent text-neutral-100 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-neutral-800 text-neutral-100">
                All Buildings (82 Apartments)
              </option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id} className="bg-neutral-800 text-neutral-100">
                  {b.name} ({b.totalFlats} Flats)
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-neutral-800/90 border border-neutral-700/60 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200">
            <Calendar className="w-3.5 h-3.5 mr-2 text-neutral-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-neutral-100 focus:outline-none cursor-pointer font-medium font-mono"
            >
              <option value="2026-10" className="bg-neutral-800 text-neutral-100">October 2026 (Current)</option>
              <option value="2026-09" className="bg-neutral-800 text-neutral-100">September 2026</option>
              <option value="2026-08" className="bg-neutral-800 text-neutral-100">August 2026</option>
              <option value="2026-07" className="bg-neutral-800 text-neutral-100">July 2026</option>
              <option value="2026-06" className="bg-neutral-800 text-neutral-100">June 2026</option>
              <option value="2026-05" className="bg-neutral-800 text-neutral-100">May 2026</option>
            </select>
          </div>

          {/* Quick Balance Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/40 text-xs text-neutral-300 font-mono">
            <span className="text-neutral-400">Total Arrears:</span>
            <span className="text-amber-400 font-semibold">{currency}{pendingCollection.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenAddElectricity}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            title="Add or record monthly electricity meter reading for a flat"
          >
            <Zap className="w-3.5 h-3.5 fill-neutral-950" />
            <span>+ Add Electricity</span>
          </button>

          <button
            onClick={onOpenBatchReadings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Fast meter reading input for 40+ flats"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fast Meter Entry</span>
          </button>

          <button
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-blue-400" />
            <span>New Ticket</span>
          </button>

          <button
            onClick={exportToCSV}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Download Excel / CSV of all electricity readings and payment balances"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
            title="Configure Electricity Tariff & Charges"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (confirm('Reset to default sample data with 82 flats, sample meter readings and maintenance tickets?')) {
                resetToSampleData();
              }
            }}
            className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
            title="Reset Sample Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
