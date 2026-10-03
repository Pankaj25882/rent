import React, { useState, useMemo } from 'react';
import { useProperty } from '../context/PropertyContext';
import { FlatMonthlyStatement } from '../types';
import { 
  Search, 
  Filter, 
  Zap, 
  Receipt, 
  CreditCard, 
  ArrowUpDown, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  SlidersHorizontal,
  FileText,
  Plus,
  Gauge
} from 'lucide-react';

interface ElectricityBillingViewProps {
  onSelectStatementForInvoice: (statement: FlatMonthlyStatement) => void;
  onSelectStatementForPayment: (statement: FlatMonthlyStatement) => void;
  onOpenBatchReadings: () => void;
  onOpenAddRent: (statement?: FlatMonthlyStatement) => void;
}

export const ElectricityBillingView: React.FC<ElectricityBillingViewProps> = ({
  onSelectStatementForInvoice,
  onSelectStatementForPayment,
  onOpenBatchReadings,
  onOpenAddRent,
}) => {
  const { 
    statements, 
    buildings, 
    selectedBuildingId, 
    selectedMonth, 
    updateElectricityReading,
    exportToCSV 
  } = useProperty();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE'>('ALL');
  const [sortBy, setSortBy] = useState<'flat' | 'balance' | 'consumption' | 'due'>('flat');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Inline editing state for meter readings
  const [editingStatementId, setEditingStatementId] = useState<string | null>(null);
  const [editStartReading, setEditStartReading] = useState<number>(0);
  const [editEndReading, setEditEndReading] = useState<number>(0);

  const activeBuilding = buildings.find(b => b.id === selectedBuildingId);
  const currency = activeBuilding ? activeBuilding.currency : '₹';

  // Filtered & sorted statements
  const filteredStatements = useMemo(() => {
    return statements
      .filter((stmt) => {
        if (selectedBuildingId !== 'all' && stmt.buildingId !== selectedBuildingId) {
          return false;
        }
        if (stmt.month !== selectedMonth) {
          return false;
        }
        if (statusFilter !== 'ALL' && stmt.status !== statusFilter) {
          return false;
        }
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchFlat = stmt.flatNumber.toLowerCase().includes(q);
          const matchTenant = stmt.tenantName.toLowerCase().includes(q);
          const matchMeter = stmt.meterNumber.toLowerCase().includes(q);
          const matchBld = stmt.buildingName.toLowerCase().includes(q);
          if (!matchFlat && !matchTenant && !matchMeter && !matchBld) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'flat') {
          diff = parseInt(a.flatNumber, 10) - parseInt(b.flatNumber, 10);
        } else if (sortBy === 'balance') {
          diff = a.balanceThisMonth - b.balanceThisMonth;
        } else if (sortBy === 'consumption') {
          diff = a.totalReading - b.totalReading;
        } else if (sortBy === 'due') {
          diff = a.totalDue - b.totalDue;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [statements, selectedBuildingId, selectedMonth, statusFilter, searchTerm, sortBy, sortOrder]);

  // Summary statistics for current filtered set
  const summary = useMemo(() => {
    let totalFlats = filteredStatements.length;
    let totalKwh = 0;
    let totalElectricityBilled = 0;
    let totalRentBilled = 0;
    let totalLastMonthBalance = 0;
    let totalGrossDue = 0;
    let totalPaid = 0;
    let totalBalanceThisMonth = 0;

    filteredStatements.forEach((s) => {
      totalKwh += s.totalReading;
      totalElectricityBilled += s.electricityAmount;
      totalRentBilled += s.baseRent;
      totalLastMonthBalance += s.lastMonthBalance;
      totalGrossDue += s.totalDue;
      totalPaid += s.paymentReceived;
      totalBalanceThisMonth += Math.max(0, s.balanceThisMonth);
    });

    const collectionRate = totalGrossDue > 0 ? (totalPaid / totalGrossDue) * 100 : 0;

    return {
      totalFlats,
      totalKwh,
      totalElectricityBilled,
      totalRentBilled,
      totalLastMonthBalance,
      totalGrossDue,
      totalPaid,
      totalBalanceThisMonth,
      collectionRate,
    };
  }, [filteredStatements]);

  const handleStartEdit = (stmt: FlatMonthlyStatement) => {
    setEditingStatementId(stmt.id);
    setEditStartReading(stmt.startReading);
    setEditEndReading(stmt.endReading);
  };

  const handleSaveEdit = (stmtId: string) => {
    if (editEndReading < editStartReading) {
      alert('Month End Reading cannot be less than Month Start Reading.');
      return;
    }
    updateElectricityReading(stmtId, editStartReading, editEndReading);
    setEditingStatementId(null);
  };

  const handleCancelEdit = () => {
    setEditingStatementId(null);
  };

  const getStatusBadge = (status: FlatMonthlyStatement['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Overdue
          </span>
        );
      case 'UNPAID':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>RENT LEDGER</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-normal">
              {filteredStatements.length} Active Records
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Automated electricity usage tracking, monthly start/end meter auditing, rent, last month balance carryover, payment, and net balance reconciliation.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Main "Add Rent" button explicitly highlighted */}
          <button
            onClick={() => onOpenAddRent()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-all cursor-pointer ring-2 ring-amber-400/30"
            title="Add rent, electricity meter readings, and balance for any apartment"
          >
            <Receipt className="w-4 h-4 text-neutral-950" />
            <span>+ Add Rent</span>
          </button>

          <button
            onClick={onOpenBatchReadings}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 rounded-lg transition-colors cursor-pointer"
            title="Fast bulk entry of meter readings for all 40+ flats"
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Batch Meter Entry (40+ Flats)</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Download full CSV matching reference format"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total kWh Consumed */}
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium flex items-center justify-between">
            <span>Power Consumed</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
            {summary.totalKwh.toLocaleString()} <span className="text-xs font-normal text-neutral-400">kWh</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Avg {(summary.totalFlats > 0 ? (summary.totalKwh / summary.totalFlats).toFixed(1) : 0)} kWh / flat
          </div>
        </div>

        {/* Electricity Billed */}
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium">
            Electricity Charges
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {currency}{summary.totalElectricityBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Auto-tariff applied
          </div>
        </div>

        {/* Base Rent Roll */}
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium">
            Total Base Rent
          </div>
          <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
            {currency}{summary.totalRentBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Across {summary.totalFlats} flats
          </div>
        </div>

        {/* Last Month Balance Arrears */}
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium">
            Last Month Arrears
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {currency}{summary.totalLastMonthBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Carried over balance
          </div>
        </div>

        {/* Payment Received */}
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium flex items-center justify-between">
            <span>Payment Received</span>
            <span className="text-[10px] text-emerald-400 font-mono">{summary.collectionRate.toFixed(0)}%</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1 tabular-nums">
            {currency}{summary.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Collected this month
          </div>
        </div>

        {/* Total Balance Due This Month */}
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium">
            Balance Due This Month
          </div>
          <div className="text-lg font-bold text-rose-400 font-mono mt-1 tabular-nums">
            {currency}{summary.totalBalanceThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Outstanding receivables
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search flat (e.g. 101, 304), resident name, or meter #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-800/80 border border-neutral-700/60 rounded-lg text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(['ALL', 'UNPAID', 'PARTIAL', 'OVERDUE', 'PAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-neutral-800 text-white border border-neutral-700 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              {st === 'ALL' ? 'All Flats' : st}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none"
          >
            <option value="flat">Flat Number</option>
            <option value="balance">Balance Due</option>
            <option value="consumption">Power (kWh)</option>
            <option value="due">Total Due</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-neutral-400 hover:text-neutral-200 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
            title="Toggle Ascending / Descending"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* The Core Table with EXACT 18 Columns matching Reference CSV */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-800/80 text-neutral-300 border-b border-neutral-800 text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">Building Name</th>
                <th className="py-3 px-3 whitespace-nowrap">Flat Number</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Tenant Name</th>
                <th className="py-3 px-3 whitespace-nowrap font-mono text-neutral-400">Billing Month</th>
                <th className="py-3 px-3 whitespace-nowrap font-mono text-neutral-400">Meter Number</th>
                <th className="py-3 px-3 text-right whitespace-nowrap bg-neutral-800/90">
                  Start Reading (kWh)
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap bg-neutral-800/90 text-amber-300 font-bold">
                  End Reading (kWh)
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap bg-neutral-800/90 text-amber-400 font-bold">
                  Total Reading (kWh)
                </th>
                <th className="py-3 px-2.5 text-right whitespace-nowrap text-neutral-400 font-mono">
                  Rate Per Unit
                </th>
                <th className="py-3 px-2.5 text-right whitespace-nowrap text-neutral-400 font-mono">
                  Fixed Meter Fee
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap text-emerald-400 font-bold">
                  Electricity Cost
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap font-semibold text-neutral-200">
                  Rent
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap text-neutral-400">
                  Last Month Balance
                </th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-white bg-neutral-800/90 border-x border-neutral-700/50">
                  <div className="flex flex-col items-end">
                    <span>Total Amount</span>
                    <span className="text-[10px] text-neutral-400 font-normal font-sans">(Rent + Elec Bill + Last Month Balance)</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap text-emerald-400 font-semibold">
                  Payment
                </th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-rose-400 bg-neutral-800/90 border-l border-neutral-700/50">
                  <div className="flex flex-col items-end">
                    <span>Balance</span>
                    <span className="text-[10px] text-rose-300/80 font-normal font-sans">(Total Amount - Payment)</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap bg-neutral-800/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredStatements.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-neutral-400 font-sans">
                    <p className="text-sm font-medium">No flat records match your search or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredStatements.map((stmt) => {
                  const isEditing = editingStatementId === stmt.id;
                  const hasOverdueCarryover = stmt.lastMonthBalance > 0;

                  return (
                    <tr 
                      key={stmt.id} 
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        stmt.balanceThisMonth > 0 ? 'bg-neutral-900/40' : 'bg-neutral-900/10'
                      }`}
                    >
                      {/* 1. Building Name */}
                      <td className="py-2.5 px-3.5 font-sans font-medium text-neutral-200 whitespace-nowrap">
                        {stmt.buildingName}
                      </td>

                      {/* 2. Flat Number */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-100">
                          #{stmt.flatNumber}
                        </span>
                      </td>

                      {/* 3. Tenant Name */}
                      <td className="py-2.5 px-3.5 font-sans text-neutral-200 whitespace-nowrap">
                        <div className="font-medium text-white">{stmt.tenantName}</div>
                      </td>

                      {/* 4. Billing Month */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                        {stmt.month}
                      </td>

                      {/* 5. Meter Number */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-amber-400/90 font-mono text-[11px]">
                        {stmt.meterNumber}
                      </td>

                      {/* 6. Start Reading (kWh) */}
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-neutral-300">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStartReading}
                            onChange={(e) => setEditStartReading(Number(e.target.value))}
                            className="w-20 px-1.5 py-1 text-right bg-neutral-800 border border-neutral-700 rounded text-xs text-white focus:outline-none"
                          />
                        ) : (
                          <span>{stmt.startReading.toLocaleString()}</span>
                        )}
                      </td>

                      {/* 7. End Reading (kWh) */}
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap font-bold text-amber-300">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editEndReading}
                            onChange={(e) => setEditEndReading(Number(e.target.value))}
                            className="w-20 px-1.5 py-1 text-right bg-neutral-800 border border-emerald-500 rounded text-xs text-white focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => onOpenAddRent(stmt)}
                            className="inline-flex items-center gap-1 group text-amber-300 hover:text-amber-200 cursor-pointer"
                            title="Click to add/update rent & electricity"
                          >
                            <span>{stmt.endReading.toLocaleString()}</span>
                            <Edit3 className="w-3 h-3 text-neutral-500 group-hover:text-amber-400" />
                          </button>
                        )}
                      </td>

                      {/* 8. Total Reading (kWh) */}
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap font-bold text-amber-400">
                        {isEditing ? (
                          <span>{Math.max(0, editEndReading - editStartReading).toLocaleString()}</span>
                        ) : (
                          <span>{stmt.totalReading.toLocaleString()}</span>
                        )}
                      </td>

                      {/* 9. Rate Per Unit */}
                      <td className="py-2.5 px-2.5 text-right tabular-nums whitespace-nowrap text-neutral-400 text-[11px]">
                        {stmt.ratePerUnit}
                      </td>

                      {/* 10. Fixed Meter Fee */}
                      <td className="py-2.5 px-2.5 text-right tabular-nums whitespace-nowrap text-neutral-400 text-[11px]">
                        {stmt.fixedUtilityCharge}
                      </td>

                      {/* 11. Electricity Cost */}
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-emerald-400 font-bold">
                        {isEditing ? (
                          <span>
                            {currency}
                            {(Math.max(0, editEndReading - editStartReading) * stmt.ratePerUnit + stmt.fixedUtilityCharge).toFixed(2)}
                          </span>
                        ) : (
                          <span>{currency}{stmt.electricityAmount.toFixed(2)}</span>
                        )}
                      </td>

                      {/* 12. Rent */}
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-neutral-200 font-semibold">
                        {currency}{stmt.baseRent.toLocaleString('en-IN')}
                      </td>

                      {/* 13. Last Month Balance */}
                      <td className={`py-2.5 px-3 text-right tabular-nums whitespace-nowrap ${
                        hasOverdueCarryover ? 'text-amber-400 font-semibold' : stmt.lastMonthBalance < 0 ? 'text-emerald-400' : 'text-neutral-400'
                      }`}>
                        {stmt.lastMonthBalance < 0 
                          ? `-${currency}${Math.abs(stmt.lastMonthBalance).toFixed(2)}`
                          : stmt.lastMonthBalance > 0 
                          ? `+${currency}${stmt.lastMonthBalance.toFixed(2)}`
                          : `0.00`
                        }
                      </td>

                      {/* 14. Total Amount (Rent + Elec Bill + Last Month Balance) */}
                      <td className="py-2.5 px-3.5 text-right tabular-nums whitespace-nowrap font-bold text-white bg-neutral-900/40 border-x border-neutral-800/50">
                        {isEditing ? (
                          <span>
                            {currency}{((Math.max(0, editEndReading - editStartReading) * stmt.ratePerUnit + stmt.fixedUtilityCharge) + stmt.baseRent + stmt.lastMonthBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span>{currency}{stmt.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </td>

                      {/* 15. Payment */}
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-emerald-400 font-semibold">
                        <button
                          onClick={() => onSelectStatementForPayment(stmt)}
                          className="hover:underline font-bold focus:outline-none cursor-pointer group inline-flex items-center gap-1 justify-end"
                          title="Click to record/update payment"
                        >
                          {stmt.paymentReceived > 0 ? (
                            <span>{currency}{stmt.paymentReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-neutral-500 font-normal">0.00</span>
                          )}
                        </button>
                      </td>

                      {/* 16. Balance (Total Amount - Payment) */}
                      <td className={`py-2.5 px-3.5 text-right tabular-nums whitespace-nowrap font-bold bg-neutral-900/40 border-l border-neutral-800/50 ${
                        (isEditing 
                          ? (((Math.max(0, editEndReading - editStartReading) * stmt.ratePerUnit + stmt.fixedUtilityCharge) + stmt.baseRent + stmt.lastMonthBalance) - stmt.paymentReceived) 
                          : stmt.balanceThisMonth) > 0 
                          ? 'text-rose-400' 
                          : 'text-emerald-400'
                      }`}>
                        {isEditing ? (
                          <span>
                            {currency}{(((Math.max(0, editEndReading - editStartReading) * stmt.ratePerUnit + stmt.fixedUtilityCharge) + stmt.baseRent + stmt.lastMonthBalance) - stmt.paymentReceived).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span>{currency}{stmt.balanceThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </td>

                      {/* 18. Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                        {getStatusBadge(stmt.status)}
                      </td>

                      {/* 19. Actions (⚡ Add Electricity Reading option prominently provided) */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-sans bg-neutral-900/60">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(stmt.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Explicit "Add / Edit Rent" button on every row */}
                            <button
                              onClick={() => onOpenAddRent(stmt)}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 rounded transition-colors cursor-pointer"
                              title="Add / Update Monthly Rent & Electricity for this Flat"
                            >
                              <Receipt className="w-3 h-3 text-amber-400" />
                              <span>Add Rent</span>
                            </button>

                            {/* Record Payment Button */}
                            <button
                              onClick={() => onSelectStatementForPayment(stmt)}
                              className="p-1.5 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Record Resident Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>

                            {/* View / Print Invoice Button */}
                            <button
                              onClick={() => onSelectStatementForInvoice(stmt)}
                              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Generate Itemized Bill & Receipt"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredStatements.length > 0 && (
              <tfoot className="border-t-2 border-neutral-700 bg-neutral-900/90 text-neutral-200 text-xs font-mono font-bold">
                <tr>
                  <td colSpan={7} className="py-3 px-3.5 text-left font-sans text-neutral-400">
                    Grand Totals ({filteredStatements.length} flats):
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400 tabular-nums">
                    {summary.totalKwh.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-2 text-center text-neutral-500 font-sans text-[11px]">
                    -
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 tabular-nums">
                    {currency}{summary.totalElectricityBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-white tabular-nums">
                    {currency}{summary.totalRentBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400 tabular-nums">
                    {currency}{summary.totalLastMonthBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-white tabular-nums bg-neutral-800/80 border-x border-neutral-700/50">
                    {currency}{summary.totalGrossDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 tabular-nums">
                    {currency}{summary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-rose-400 tabular-nums bg-neutral-800/80 border-l border-neutral-700/50">
                    {currency}{summary.totalBalanceThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-neutral-400 font-sans">
                    {summary.collectionRate.toFixed(1)}% Collected
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Footer with Summary matching reference columns */}
        <div className="bg-neutral-800/70 border-t border-neutral-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
          <div>
            Showing <span className="font-semibold text-white">{filteredStatements.length}</span> flats
            {selectedBuildingId !== 'all' ? ` in ${activeBuilding?.name}` : ' across all buildings'}.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>
              Total Units: <strong className="text-amber-400">{summary.totalKwh.toLocaleString()} kWh</strong>
            </span>
            <span>
              Power Billed: <strong className="text-amber-400">{currency}{summary.totalElectricityBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </span>
            <span>
              Total Collected: <strong className="text-emerald-400">{currency}{summary.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </span>
            <span>
              Balance Due: <strong className="text-rose-400">{currency}{summary.totalBalanceThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
