import React from 'react';
import { useProperty } from '../context/PropertyContext';
import { 
  Building2, 
  Zap, 
  Receipt, 
  CreditCard, 
  Wrench, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  Users,
  Clock,
  ChevronRight,
  Wallet,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import modernApartmentImg from '../assets/images/modern_apartment_complex_1791033659877.jpg';
import { RevenueD3Chart } from './RevenueD3Chart';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenBatchReadings: () => void;
  onOpenNewTicket: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenBatchReadings,
  onOpenNewTicket,
}) => {
  const { 
    buildings, 
    statements, 
    buildingExpenses,
    maintenanceRequests, 
    selectedBuildingId, 
    selectedMonth 
  } = useProperty();

  const filteredStatements = selectedBuildingId === 'all'
    ? statements.filter(s => s.month === selectedMonth)
    : statements.filter(s => s.buildingId === selectedBuildingId && s.month === selectedMonth);

  const filteredExpenses = selectedBuildingId === 'all'
    ? buildingExpenses.filter(e => e.month === selectedMonth)
    : buildingExpenses.filter(e => e.buildingId === selectedBuildingId && e.month === selectedMonth);

  const filteredMaintenance = selectedBuildingId === 'all'
    ? maintenanceRequests
    : maintenanceRequests.filter(m => m.buildingId === selectedBuildingId);

  const activeBuilding = buildings.find(b => b.id === selectedBuildingId);
  const currency = activeBuilding ? activeBuilding.currency : '₹';

  // Calculations for current month
  const totalFlats = filteredStatements.length;
  const totalGrossDue = filteredStatements.reduce((sum, s) => sum + s.totalDue, 0);
  const totalCollected = filteredStatements.reduce((sum, s) => sum + s.paymentReceived, 0);
  const totalOutstanding = filteredStatements.reduce((sum, s) => sum + Math.max(0, s.balanceThisMonth), 0);
  const totalKwh = filteredStatements.reduce((sum, s) => sum + s.totalReading, 0);
  const totalElectricityBilled = filteredStatements.reduce((sum, s) => sum + s.electricityAmount, 0);
  const totalRentBilled = filteredStatements.reduce((sum, s) => sum + s.baseRent, 0);
  const collectionPercentage = totalGrossDue > 0 ? (totalCollected / totalGrossDue) * 100 : 0;

  // Building Expenses & Net Operating Income
  const totalBuildingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netMonthlyProfit = totalCollected - totalBuildingExpenses;
  const profitMargin = totalCollected > 0 ? (netMonthlyProfit / totalCollected) * 100 : 0;

  const openTickets = filteredMaintenance.filter(m => m.status === 'NEW' || m.status === 'IN_PROGRESS' || m.status === 'WAITING_PARTS');

  // Top consumers
  const topConsumers = [...filteredStatements]
    .sort((a, b) => b.totalReading - a.totalReading)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Hero Banner with Architectural Complex Image */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-md">
        <div className="absolute inset-0">
          <img 
            src={modernApartmentImg} 
            alt="Multi-Building Residential Complex" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent"></div>
        </div>

        <div className="relative p-6 sm:p-8 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Building2 className="w-3.5 h-3.5" />
            <span>Multi-Building Complex Portfolio · {buildings.length} Properties</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {selectedBuildingId === 'all' ? 'All Apartment Complexes' : activeBuilding?.name}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Managing <strong className="text-white font-mono">{totalFlats} apartments</strong> with sub-meter electricity readings, automated Rupee ({currency}) billing, flat rent rolls, full building operating expenses, and net profit tracking.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigateTab('billing')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Open Rent Ledger
            </button>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Manage Building Expenses
            </button>
            <button
              onClick={onOpenBatchReadings}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Enter Month-End Meter Readings
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid with Net Profit & Building Expenses */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inflow Collected */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Collections Received</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-2 tabular-nums">
            {currency}{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between font-mono">
            <span>Rent: {currency}{totalRentBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-emerald-400">{collectionPercentage.toFixed(0)}% collected</span>
          </div>
        </div>

        {/* Total Building Operating Expenses */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Building Operating Expenses</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono mt-2 tabular-nums">
            {currency}{totalBuildingExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Common power, security, lift AMC, housekeeping
          </div>
        </div>

        {/* Net Monthly Operating Profit */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Net Operating Income</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-2 tabular-nums">
            {currency}{netMonthlyProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Operating Margin:</span>
            <span className="text-sky-400 font-semibold font-mono">{profitMargin.toFixed(1)}%</span>
          </div>
        </div>

        {/* Power Consumed & Electricity Billing */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Electricity Power Consumed</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-2 tabular-nums">
            {totalKwh.toLocaleString()} <span className="text-xs font-normal text-neutral-400">kWh</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between font-mono">
            <span>Billed: {currency}{totalElectricityBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span>Avg {(totalFlats > 0 ? (totalKwh / totalFlats).toFixed(0) : 0)} kWh/flat</span>
          </div>
        </div>

      </div>

      {/* D3-based Revenue, Utility & Building Expense Interactive Chart */}
      <RevenueD3Chart />

      {/* Buildings Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buildings.map((bld) => {
          const bldStmts = statements.filter(s => s.buildingId === bld.id && s.month === selectedMonth);
          const bldExps = buildingExpenses.filter(e => e.buildingId === bld.id && e.month === selectedMonth);
          const bldFlats = bldStmts.length;
          const bldDue = bldStmts.reduce((sum, s) => sum + s.totalDue, 0);
          const bldPaid = bldStmts.reduce((sum, s) => sum + s.paymentReceived, 0);
          const bldExp = bldExps.reduce((sum, e) => sum + e.amount, 0);
          const bldKwh = bldStmts.reduce((sum, s) => sum + s.totalReading, 0);
          const bldProfit = bldPaid - bldExp;

          return (
            <div 
              key={bld.id} 
              className="p-5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">{bld.name}</h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{bld.address}</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                  {bld.totalFlats} Flats
                </span>
              </div>

              {/* Inflow vs Outflow grid */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-neutral-950 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 text-[10px] block font-sans">Collected</span>
                  <span className="text-emerald-400 font-bold">{bld.currency}{bldPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block font-sans">Full Expenses</span>
                  <span className="text-rose-400 font-bold">{bld.currency}{bldExp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block font-sans">Net Profit</span>
                  <span className="text-sky-400 font-bold">{bld.currency}{bldProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <span>Tariff: {bld.currency}{bld.electricityRatePerUnit}/kWh (Meter Fee: {bld.currency}{bld.fixedMeterCharge})</span>
                <button
                  onClick={() => onNavigateTab('billing')}
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  <span>View All {bld.totalFlats} Flats</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Top Electricity Usage & Open Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Top Electricity Usage Flat List */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Top Electricity Consumers (This Month)</h3>
            </div>
            <button
              onClick={() => onNavigateTab('billing')}
              className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              View Full Roll
            </button>
          </div>

          <div className="space-y-2.5">
            {topConsumers.map((stmt) => (
              <div
                key={stmt.id}
                className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Flat #{stmt.flatNumber}</span>
                    <span className="text-neutral-400 text-[11px]">· {stmt.buildingName}</span>
                    <span className="text-neutral-400 text-[11px]">({stmt.tenantName})</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Start: {stmt.startReading} kWh · End: {stmt.endReading} kWh
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-amber-400 text-sm tabular-nums">
                    {stmt.totalReading.toLocaleString()} kWh
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {currency}{stmt.electricityAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Active Maintenance & Repairs</h3>
            </div>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              View All ({openTickets.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {openTickets.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs">
                No open maintenance requests across the buildings.
              </div>
            ) : (
              openTickets.slice(0, 4).map((ticket) => (
                <div 
                  key={ticket.id}
                  className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Flat #{ticket.flatNumber}</span>
                      <span className="text-neutral-400 text-[11px]">· {ticket.buildingName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        ticket.priority === 'EMERGENCY'
                          ? 'bg-rose-500/20 text-rose-300'
                          : ticket.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-xs font-medium">{ticket.title}</p>
                    <p className="text-neutral-400 text-[11px]">{ticket.assignedTechnician || 'Unassigned technician'}</p>
                  </div>

                  <span className={`text-[11px] px-2 py-1 rounded font-medium ${
                    ticket.status === 'IN_PROGRESS' 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
