import React, { useState, useEffect } from 'react';
import { useProperty } from '../context/PropertyContext';
import { FlatMonthlyStatement, Flat, Building } from '../types';
import { Zap, X, Check, Calculator, ArrowRight, Gauge, Building2, User } from 'lucide-react';

interface AddElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedStatement?: FlatMonthlyStatement | null;
}

export const AddElectricityModal: React.FC<AddElectricityModalProps> = ({
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
    updateElectricityReading 
  } = useProperty();

  // Selected building & flat
  const [bldId, setBldId] = useState<string>(() => {
    if (preSelectedStatement) return preSelectedStatement.buildingId;
    if (selectedBuildingId !== 'all') return selectedBuildingId;
    return buildings[0]?.id || '';
  });

  const buildingFlats = flats.filter(f => f.buildingId === bldId);

  const [flatId, setFlatId] = useState<string>(() => {
    if (preSelectedStatement) return preSelectedStatement.flatId;
    return buildingFlats[0]?.id || '';
  });

  const [targetMonth, setTargetMonth] = useState<string>(() => {
    if (preSelectedStatement) return preSelectedStatement.month;
    return selectedMonth;
  });

  // Find current statement if exists
  const currentStatement = statements.find(
    s => s.flatId === flatId && s.month === targetMonth
  ) || preSelectedStatement;

  const activeBuilding = buildings.find(b => b.id === bldId) || buildings[0];
  const activeFlat = flats.find(f => f.id === flatId) || buildingFlats[0];
  const currency = activeBuilding ? activeBuilding.currency : '₹';

  // Meter readings state
  const [startReading, setStartReading] = useState<number>(() => {
    if (currentStatement) return currentStatement.startReading;
    return 3000;
  });

  const [endReading, setEndReading] = useState<number>(() => {
    if (currentStatement) return currentStatement.endReading;
    return 3250;
  });

  const [ratePerUnit, setRatePerUnit] = useState<number>(() => {
    if (currentStatement) return currentStatement.ratePerUnit;
    return activeBuilding?.electricityRatePerUnit || 9.0;
  });

  const [fixedMeterFee, setFixedMeterFee] = useState<number>(() => {
    if (currentStatement) return currentStatement.fixedUtilityCharge;
    return activeBuilding?.fixedMeterCharge || 100;
  });

  // Update when selection changes or preSelectedStatement changes
  useEffect(() => {
    if (preSelectedStatement) {
      setBldId(preSelectedStatement.buildingId);
      setFlatId(preSelectedStatement.flatId);
      setTargetMonth(preSelectedStatement.month);
      setStartReading(preSelectedStatement.startReading);
      setEndReading(preSelectedStatement.endReading);
      setRatePerUnit(preSelectedStatement.ratePerUnit);
      setFixedMeterFee(preSelectedStatement.fixedUtilityCharge);
    } else if (currentStatement) {
      setStartReading(currentStatement.startReading);
      setEndReading(currentStatement.endReading);
      setRatePerUnit(currentStatement.ratePerUnit);
      setFixedMeterFee(currentStatement.fixedUtilityCharge);
    } else if (activeBuilding) {
      setRatePerUnit(activeBuilding.electricityRatePerUnit);
      setFixedMeterFee(activeBuilding.fixedMeterCharge);
    }
  }, [preSelectedStatement, flatId, targetMonth, bldId]);

  if (!isOpen) return null;

  // Real-time calculations
  const totalUnits = Math.max(0, Number((endReading - startReading).toFixed(2)));
  const energyCharge = Number((totalUnits * ratePerUnit).toFixed(2));
  const electricityCost = Number((energyCharge + fixedMeterFee).toFixed(2));
  const baseRent = currentStatement?.baseRent || activeFlat?.baseRent || 20000;
  const lastMonthBalance = currentStatement?.lastMonthBalance || 0;
  const totalDue = Number((lastMonthBalance + baseRent + electricityCost).toFixed(2));
  const isInvalid = endReading < startReading;

  const handleBuildingChange = (newBldId: string) => {
    setBldId(newBldId);
    const newFlats = flats.filter(f => f.buildingId === newBldId);
    if (newFlats.length > 0) {
      setFlatId(newFlats[0].id);
    }
    const b = buildings.find(item => item.id === newBldId);
    if (b) {
      setRatePerUnit(b.electricityRatePerUnit);
      setFixedMeterFee(b.fixedMeterCharge);
    }
  };

  const handleSaveElectricity = (e: React.FormEvent) => {
    e.preventDefault();

    if (isInvalid) {
      alert(`Validation Error: Month End Reading (${endReading}) cannot be less than Month Start Reading (${startReading}).`);
      return;
    }

    if (!currentStatement) {
      alert(`No statement record found for Flat #${activeFlat?.flatNumber} for ${targetMonth}.`);
      return;
    }

    updateElectricityReading(currentStatement.id, startReading, endReading);
    alert(`Electricity Reading saved for Flat #${currentStatement.flatNumber} (${currentStatement.tenantName})!\nUnits Consumed: ${totalUnits} kWh\nElectricity Bill: ${currency}${electricityCost.toFixed(2)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Add / Record Electricity Reading</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Log start and end meter numbers to generate automated tenant electricity billing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveElectricity} className="p-6 space-y-4 text-xs">
          
          {/* Premises Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-300 font-medium block mb-1">Building</label>
              <select
                value={bldId}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1">Flat & Resident</label>
              <select
                value={flatId}
                onChange={(e) => setFlatId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {buildingFlats.map(f => (
                  <option key={f.id} value={f.id}>
                    Flat #{f.flatNumber} · {f.tenantName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-Meter & Tenant Info Card */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-neutral-400 text-[10px] block">Resident Name</span>
              <span className="font-semibold text-white truncate block">{activeFlat?.tenantName}</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] block">Electric Meter Serial</span>
              <span className="font-mono text-amber-400 font-semibold">{activeFlat?.meterNumber}</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] block">Billing Cycle</span>
              <span className="font-mono text-neutral-200">{targetMonth}</span>
            </div>
          </div>

          {/* Meter Readings Inputs */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-800/40 border border-neutral-700/60">
            <div>
              <label className="text-neutral-200 font-semibold block mb-1.5 flex items-center justify-between">
                <span>Month Start Reading</span>
                <span className="text-[10px] text-neutral-400 font-mono">kWh</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={startReading}
                onChange={(e) => setStartReading(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                required
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">Carried from previous cycle</span>
            </div>

            <div>
              <label className="text-neutral-200 font-semibold block mb-1.5 flex items-center justify-between">
                <span>Month End Reading</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">LATEST kWh</span>
              </label>
              <input
                type="number"
                step="1"
                value={endReading}
                onChange={(e) => setEndReading(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-white font-mono font-bold text-sm focus:outline-none transition-colors ${
                  isInvalid 
                    ? 'border-rose-500 text-rose-300' 
                    : 'border-neutral-700 focus:border-amber-500'
                }`}
                autoFocus
                required
              />
              {isInvalid ? (
                <span className="text-[10px] text-rose-400 mt-1 block">Must be &ge; {startReading}</span>
              ) : (
                <span className="text-[10px] text-neutral-400 mt-1 block">Meter reading taken at month-end</span>
              )}
            </div>
          </div>

          {/* Tariff & Fixed Fee Inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-neutral-300 font-medium block mb-1">
                Tariff Rate ({currency} / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1">
                Fixed Sub-Meter Fee ({currency})
              </label>
              <input
                type="number"
                step="1"
                value={fixedMeterFee}
                onChange={(e) => setFixedMeterFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          {/* Real-time Automated Billing Calculation Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Calculator className="w-4 h-4" />
                <span>Automated Calculation Result</span>
              </span>
              <span className="font-mono text-neutral-400 text-[11px]">Formula: (End - Start) × Rate + Fee</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80">
                <span className="text-neutral-400 text-[10px] block font-sans">Total Power Consumed</span>
                <span className="font-bold text-amber-400 text-sm tabular-nums">
                  {totalUnits.toLocaleString()} kWh
                </span>
              </div>

              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80">
                <span className="text-neutral-400 text-[10px] block font-sans">Calculated Electricity Bill</span>
                <span className="font-bold text-emerald-400 text-sm tabular-nums">
                  {currency}{electricityCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bill Impact Breakdown */}
            <div className="pt-2 border-t border-neutral-800 text-[11px] font-mono text-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Flat Base Rent:</span>
                <span>{currency}{baseRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Electricity Bill:</span>
                <span className="text-emerald-400">+{currency}{electricityCost.toFixed(2)}</span>
              </div>
              {lastMonthBalance !== 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Last Month Balance:</span>
                  <span>{lastMonthBalance > 0 ? `+${currency}${lastMonthBalance.toFixed(2)}` : `-${currency}${Math.abs(lastMonthBalance).toFixed(2)}`}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-neutral-800 font-bold text-xs text-white">
                <span>Updated Total Due for Month:</span>
                <span className="text-white">{currency}{totalDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInvalid}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>Save & Apply Electricity Bill</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
