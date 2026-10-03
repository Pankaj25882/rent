import React, { useState, useEffect, useMemo } from 'react';
import { useProperty } from '../context/PropertyContext';
import { FlatMonthlyStatement, Flat, Building } from '../types';
import { 
  Building2, 
  User, 
  Calendar, 
  Zap, 
  DollarSign, 
  Receipt, 
  CreditCard, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

interface AddRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedStatement?: FlatMonthlyStatement | null;
}

// Utility to calculate previous month string (e.g. '2026-10' -> '2026-09')
const getPreviousMonthString = (month: string): string => {
  const [yearStr, monthStr] = month.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10) - 1;
  if (m <= 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
};

export const AddRentModal: React.FC<AddRentModalProps> = ({
  isOpen,
  onClose,
  preSelectedStatement,
}) => {
  const { 
    buildings, 
    flats, 
    statements, 
    selectedBuildingId, 
    selectedMonth, 
    upsertRentStatement 
  } = useProperty();

  // Target Month selection
  const [targetMonth, setTargetMonth] = useState<string>(() => {
    return preSelectedStatement?.month || selectedMonth || '2026-10';
  });

  // Flat selection
  const [selectedFlatId, setSelectedFlatId] = useState<string>(() => {
    if (preSelectedStatement) return preSelectedStatement.flatId;
    if (selectedBuildingId !== 'all') {
      const bldFlats = flats.filter(f => f.buildingId === selectedBuildingId);
      if (bldFlats.length > 0) return bldFlats[0].id;
    }
    return flats[0]?.id || '';
  });

  const activeFlat = useMemo(() => {
    return flats.find(f => f.id === selectedFlatId) || flats[0];
  }, [flats, selectedFlatId]);

  const activeBuilding = useMemo(() => {
    if (!activeFlat) return buildings[0];
    return buildings.find(b => b.id === activeFlat.buildingId) || buildings[0];
  }, [buildings, activeFlat]);

  const currency = activeBuilding ? activeBuilding.currency : '₹';
  const ratePerUnit = activeBuilding?.electricityRatePerUnit || 9.0;
  const fixedMeterFee = activeBuilding?.fixedMeterCharge || 100;

  // Previous month data lookup
  const previousMonthStr = useMemo(() => {
    return getPreviousMonthString(targetMonth);
  }, [targetMonth]);

  const previousStatement = useMemo(() => {
    if (!activeFlat) return undefined;
    return statements.find(s => s.flatId === activeFlat.id && s.month === previousMonthStr);
  }, [statements, activeFlat, previousMonthStr]);

  // Current statement if already exists for this target month
  const existingStatement = useMemo(() => {
    if (!activeFlat) return undefined;
    return statements.find(s => s.flatId === activeFlat.id && s.month === targetMonth);
  }, [statements, activeFlat, targetMonth]);

  // Form Fields
  const [rentAmount, setRentAmount] = useState<number>(20000);
  const [lastMonthStartReading, setLastMonthStartReading] = useState<number>(3000);
  const [currentEndReading, setCurrentEndReading] = useState<number>(3250);
  const [lastMonthBalance, setLastMonthBalance] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Sync inputs when flat or targetMonth changes
  useEffect(() => {
    if (preSelectedStatement && preSelectedStatement.flatId === selectedFlatId && preSelectedStatement.month === targetMonth) {
      setRentAmount(preSelectedStatement.baseRent);
      setLastMonthStartReading(preSelectedStatement.startReading);
      setCurrentEndReading(preSelectedStatement.endReading);
      setLastMonthBalance(preSelectedStatement.lastMonthBalance);
      setPaymentAmount(preSelectedStatement.paymentReceived);
      return;
    }

    if (existingStatement) {
      // If current month statement exists, load it
      setRentAmount(existingStatement.baseRent);
      setLastMonthStartReading(existingStatement.startReading);
      setCurrentEndReading(existingStatement.endReading);
      setLastMonthBalance(existingStatement.lastMonthBalance);
      setPaymentAmount(existingStatement.paymentReceived);
    } else {
      // Automatically prefetch from previous month data:
      // 1. Rent from last month (or flat default)
      const fetchedRent = previousStatement?.baseRent ?? activeFlat?.baseRent ?? 20000;
      setRentAmount(fetchedRent);

      // 2. Electricity last month reading (becomes current start reading)
      const fetchedStartReading = previousStatement?.endReading ?? 3000;
      setLastMonthStartReading(fetchedStartReading);

      // 3. User fillable end reading (default to start + typical monthly usage)
      setCurrentEndReading(fetchedStartReading + 240);

      // 4. Last month balance (fetched from previous month's ending balance)
      const fetchedLastBal = previousStatement?.balanceThisMonth ?? 0;
      setLastMonthBalance(fetchedLastBal);

      // 5. Payment default
      setPaymentAmount(0);
    }
  }, [selectedFlatId, targetMonth, previousStatement, existingStatement, activeFlat, preSelectedStatement]);

  if (!isOpen) return null;

  // Real-time Automated Calculations
  const unitsConsumed = Math.max(0, Number((currentEndReading - lastMonthStartReading).toFixed(2)));
  const energyCharges = Number((unitsConsumed * ratePerUnit).toFixed(2));
  const electricityBill = Number((energyCharges + fixedMeterFee).toFixed(2));
  
  // Total Amount = Rent + Elec Bill + Last Month Balance
  const totalAmount = Number((rentAmount + electricityBill + lastMonthBalance).toFixed(2));
  
  // Balance = Total Amount - Payment
  const netBalance = Number((totalAmount - paymentAmount).toFixed(2));

  const isReadingInvalid = currentEndReading < lastMonthStartReading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadingInvalid) {
      alert(`Validation Warning: Current Electricity Reading (${currentEndReading}) cannot be less than Last Month Reading (${lastMonthStartReading}).`);
      return;
    }

    if (!activeFlat) {
      alert('Please select a valid tenant/apartment.');
      return;
    }

    upsertRentStatement({
      flatId: activeFlat.id,
      month: targetMonth,
      baseRent: rentAmount,
      startReading: lastMonthStartReading,
      endReading: currentEndReading,
      lastMonthBalance,
      paymentReceived: paymentAmount,
    });

    alert(
      `Rent & Electricity saved for Flat #${activeFlat.flatNumber} (${activeFlat.tenantName})!\n` +
      `Rent: ${currency}${rentAmount.toLocaleString('en-IN')}\n` +
      `Electricity Bill: ${currency}${electricityBill.toFixed(2)} (${unitsConsumed} kWh)\n` +
      `Total Payable: ${currency}${totalAmount.toFixed(2)}\n` +
      `Payment: ${currency}${paymentAmount.toFixed(2)}\n` +
      `Balance: ${currency}${netBalance.toFixed(2)}`
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Add Rent & Electricity Record</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-normal">
                  {targetMonth}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Prefills last month rent, start meter reading, and balance. Calculates total payable and net balance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
          
          {/* Top Row: Tenant Dropdown & Billing Month */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 1. Tenant Dropdown Selector */}
            <div className="sm:col-span-2">
              <label className="text-neutral-300 font-semibold block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Tenant / Flat (From Dropdown)</span>
              </label>
              <select
                value={selectedFlatId}
                onChange={(e) => setSelectedFlatId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {flats.map((flat) => {
                  const bld = buildings.find(b => b.id === flat.buildingId);
                  return (
                    <option key={flat.id} value={flat.id} className="bg-neutral-900 text-white">
                      {flat.tenantName} — Flat #{flat.flatNumber} ({bld?.name || 'Building'})
                    </option>
                  );
                })}
              </select>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Sub-meter: <strong className="text-neutral-400 font-mono">{activeFlat?.meterNumber}</strong> · Complex: <strong className="text-neutral-400">{activeBuilding?.name}</strong>
              </span>
            </div>

            {/* 2. Billing Month */}
            <div>
              <label className="text-neutral-300 font-semibold block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Billing Month</span>
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
                <option value="2026-06">June 2026</option>
                <option value="2026-05">May 2026</option>
              </select>
              <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
                Prev Cycle: {previousMonthStr}
              </span>
            </div>

          </div>

          {/* Section A: Rent (Auto-fetched from last month data) */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-neutral-200 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Monthly Rent ({currency})</span>
              </label>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                {previousStatement ? `✓ Taken from ${previousMonthStr} data` : 'Standard lease rate'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="100"
                min="0"
                value={rentAmount}
                onChange={(e) => setRentAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Monthly flat rental charge automatically populated from {activeFlat?.tenantName}'s prior billing.
            </p>
          </div>

          {/* Section B: Electricity (Last month reading + Fill current month reading + Fixed rate calculation) */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-neutral-200 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Electricity Consumption & Fixed Rate Tariff</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                Tariff: {currency}{ratePerUnit}/kWh + {currency}{fixedMeterFee} meter base
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Electricity last month (Start Reading) */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-medium">Electricity Last Month (Start kWh)</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {previousStatement ? `From ${previousMonthStr}` : 'Meter Initial'}
                  </span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={lastMonthStartReading}
                  onChange={(e) => setLastMonthStartReading(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 font-mono font-medium focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Electricity in which I will fill (Current Month Reading) */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-amber-300 font-bold">Electricity Current Month (End kWh) [FILL HERE]</span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">Active Input</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={currentEndReading}
                  onChange={(e) => setCurrentEndReading(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-white font-mono font-bold text-sm focus:outline-none transition-colors ${
                    isReadingInvalid 
                      ? 'border-rose-500 text-rose-300 bg-rose-950/20' 
                      : 'border-amber-400/80 focus:border-amber-300 ring-1 ring-amber-400/30'
                  }`}
                  placeholder="Enter current meter reading"
                  required
                />
                {isReadingInvalid && (
                  <span className="text-[10px] text-rose-400 mt-1 block">
                    Must be &ge; last month reading ({lastMonthStartReading})
                  </span>
                )}
              </div>

            </div>

            {/* Live Tariff Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
              <div>
                <span className="text-neutral-500 block font-sans text-[10px]">Power Consumed:</span>
                <span className="text-amber-400 font-bold">{unitsConsumed.toLocaleString()} kWh</span>
              </div>
              <div>
                <span className="text-neutral-500 block font-sans text-[10px]">Energy @ {currency}{ratePerUnit}/unit:</span>
                <span className="text-neutral-300">{currency}{energyCharges.toFixed(2)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-neutral-500 block font-sans text-[10px]">Total Electricity Bill:</span>
                <span className="text-emerald-400 font-bold">{currency}{electricityBill.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Section C: Last Month Balance (Fetched from last month balance) */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-neutral-200 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Last Month Balance ({currency})</span>
              </label>
              <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-mono">
                {previousStatement ? `✓ Fetched from ${previousMonthStr} balance` : 'No prior arrears'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                value={lastMonthBalance}
                onChange={(e) => setLastMonthBalance(parseFloat(e.target.value) || 0)}
                className={`w-full pl-8 pr-4 py-2 bg-neutral-800 border rounded-lg font-mono font-bold text-sm focus:outline-none ${
                  lastMonthBalance > 0 
                    ? 'border-amber-500/80 text-amber-400' 
                    : lastMonthBalance < 0 
                    ? 'border-emerald-500/80 text-emerald-400' 
                    : 'border-neutral-700 text-neutral-200'
                }`}
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Unpaid arrears (+{currency}) or advance payment credit (-{currency}) automatically retrieved from {previousMonthStr}.
            </p>
          </div>

          {/* Section D: Total Payable Calculation Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-850 border-2 border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                4. Total Amount Calculation
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                = {currency}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Formula visualization */}
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Rent:</span>
                <span className="text-white">+{currency}{rentAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Electricity Bill ({unitsConsumed} kWh):</span>
                <span className="text-amber-400">+{currency}{electricityBill.toFixed(2)}</span>
              </div>
              {lastMonthBalance !== 0 && (
                <div className={`flex items-center justify-between ${lastMonthBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <span>Last Month Balance:</span>
                  <span>{lastMonthBalance > 0 ? `+${currency}${lastMonthBalance.toFixed(2)}` : `-${currency}${Math.abs(lastMonthBalance).toFixed(2)}`}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between font-bold text-white text-xs">
                <span className="font-sans">Total Amount (Rent + Elec Bill + Last Month Balance):</span>
                <span className="text-emerald-400 font-mono text-sm">{currency}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Section E: Payment & Balance Calculation */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <label className="text-neutral-200 font-bold block">
              5. Payment & Net Balance Calculation
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 block mb-1 text-[11px]">
                  Payment Received ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(totalAmount)}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Set Full ({currency}{totalAmount.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(0)}
                    className="text-[10px] text-neutral-500 hover:underline cursor-pointer"
                  >
                    Clear (0.00)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 text-[11px]">
                  Balance (Total Amount - Payment)
                </label>
                <div className={`p-2.5 rounded-lg border font-mono font-bold text-sm flex items-center justify-between ${
                  netBalance > 0 
                    ? 'bg-rose-950/20 border-rose-800/60 text-rose-400' 
                    : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-400'
                }`}>
                  <span className="text-[11px] font-sans font-normal text-neutral-400">Net Due:</span>
                  <span>{currency}{netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  {netBalance <= 0 ? '✓ Account Settled' : '⚠️ Pending Balance will carry over'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReadingInvalid}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Rent Entry</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
