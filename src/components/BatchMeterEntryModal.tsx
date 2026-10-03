import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { Zap, X, Check, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface BatchMeterEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchMeterEntryModal: React.FC<BatchMeterEntryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    buildings, 
    statements, 
    selectedBuildingId, 
    selectedMonth, 
    batchUpdateReadings 
  } = useProperty();

  const [activeBuildingId, setActiveBuildingId] = useState<string>(
    selectedBuildingId === 'all' ? (buildings[0]?.id || '') : selectedBuildingId
  );

  // Filter statements for selected building and month
  const buildingStatements = statements.filter(
    s => s.buildingId === activeBuildingId && s.month === selectedMonth
  );

  const activeBuilding = buildings.find(b => b.id === activeBuildingId);
  const currency = activeBuilding ? activeBuilding.currency : '₹';
  const ratePerUnit = activeBuilding ? activeBuilding.electricityRatePerUnit : 9.0;
  const fixedCharge = activeBuilding ? activeBuilding.fixedMeterCharge : 100;

  // Local state for batch inputs: map of statementId -> endReading
  const [readingsState, setReadingsState] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    buildingStatements.forEach(s => {
      initial[s.id] = s.endReading;
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleReadingChange = (statementId: string, val: string) => {
    const num = parseFloat(val);
    setReadingsState(prev => ({
      ...prev,
      [statementId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSimulateQuickReadings = () => {
    // Helpful simulation button: landlord can click to advance readings by a standard realistic consumption (+180 to +350 kWh)
    const simulated: Record<string, number> = {};
    buildingStatements.forEach((s, idx) => {
      const increment = 190 + ((idx * 33) % 200);
      simulated[s.id] = s.startReading + increment;
    });
    setReadingsState(simulated);
  };

  const handleSaveAll = () => {
    // Validate that no end reading is strictly less than start reading
    const updates: { statementId: string; endReading: number }[] = [];
    for (const stmt of buildingStatements) {
      const end = readingsState[stmt.id] !== undefined ? readingsState[stmt.id] : stmt.endReading;
      if (end < stmt.startReading) {
        alert(`Validation Error: Flat #${stmt.flatNumber} has end reading (${end}) lower than start reading (${stmt.startReading}).`);
        return;
      }
      updates.push({ statementId: stmt.id, endReading: end });
    }

    batchUpdateReadings(updates);
    alert(`Successfully updated meter readings for ${updates.length} flats in ${activeBuilding?.name}!`);
    onClose();
  };

  // Calculate live aggregate stats for the batch
  let totalBatchUnits = 0;
  let totalBatchCost = 0;
  buildingStatements.forEach(s => {
    const currentEnd = readingsState[s.id] !== undefined ? readingsState[s.id] : s.endReading;
    const units = Math.max(0, currentEnd - s.startReading);
    totalBatchUnits += units;
    totalBatchCost += (units * ratePerUnit + fixedCharge);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Fast Batch Meter Entry</span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono font-normal">
                  {buildingStatements.length} Meters Listed
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Quickly input month-end electricity meter readings across all 40+ apartments with live tariff calculation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Building selector & Controls strip */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">Target Building:</span>
            <select
              value={activeBuildingId}
              onChange={(e) => setActiveBuildingId(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none"
            >
              {buildings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.totalFlats} Flats)
                </option>
              ))}
            </select>
            <span className="text-neutral-400 font-mono">
              Tariff: {currency}{ratePerUnit}/kWh + {currency}{fixedCharge} base
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono text-neutral-300">
              Batch Consumption: <strong className="text-amber-400">{totalBatchUnits.toLocaleString()} kWh</strong>
              <span className="text-neutral-400 ml-2">({currency}{totalBatchCost.toFixed(2)})</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateQuickReadings}
              className="px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors"
              title="Auto-fill with realistic consumption increments"
            >
              Auto-fill Increments
            </button>
          </div>
        </div>

        {/* Scrollable Grid Table */}
        <div className="overflow-y-auto flex-1 p-6 space-y-2">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="sticky top-0 bg-neutral-900 shadow-xs z-10">
              <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] font-sans font-semibold">
                <th className="py-2.5 px-3">Flat</th>
                <th className="py-2.5 px-3">Tenant Name</th>
                <th className="py-2.5 px-3">Meter ID</th>
                <th className="py-2.5 px-3 text-right">Start Reading</th>
                <th className="py-2.5 px-3 text-right text-amber-300 font-bold">End Reading [INPUT]</th>
                <th className="py-2.5 px-3 text-right text-amber-400 font-bold">Total Units</th>
                <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Electricity Cost</th>
                <th className="py-2.5 px-3 text-right text-neutral-300 font-semibold">Rent</th>
                <th className="py-2.5 px-3 text-right text-neutral-400">Last Month Balance</th>
                <th className="py-2.5 px-3 text-right text-white font-bold bg-neutral-800/90 border-x border-neutral-700/50">
                  <div className="flex flex-col items-end">
                    <span>Total Amount</span>
                    <span className="text-[9px] text-neutral-400 font-normal font-sans">(Rent + Elec + Last Bal)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right text-emerald-400 font-semibold">Payment</th>
                <th className="py-2.5 px-3 text-right text-rose-400 font-bold bg-neutral-800/90 border-l border-neutral-700/50">
                  <div className="flex flex-col items-end">
                    <span>Balance</span>
                    <span className="text-[9px] text-rose-300/80 font-normal font-sans">(Total Amount - Payment)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {buildingStatements.map((stmt, idx) => {
                const currentEnd = readingsState[stmt.id] !== undefined ? readingsState[stmt.id] : stmt.endReading;
                const units = Math.max(0, currentEnd - stmt.startReading);
                const cost = Number((units * ratePerUnit + fixedCharge).toFixed(2));
                const flatRent = stmt.baseRent;
                const lastBal = stmt.lastMonthBalance;
                const totalAmt = Number((flatRent + cost + lastBal).toFixed(2));
                const payment = stmt.paymentReceived;
                const balance = Number((totalAmt - payment).toFixed(2));
                const isInvalid = currentEnd < stmt.startReading;

                return (
                  <tr 
                    key={stmt.id} 
                    className={`hover:bg-neutral-800/50 transition-colors ${
                      isInvalid ? 'bg-rose-950/20' : idx % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-900/60'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                      #{stmt.flatNumber}
                    </td>
                    <td className="py-2 px-3 font-sans text-neutral-300 whitespace-nowrap">
                      {stmt.tenantName}
                    </td>
                    <td className="py-2 px-3 text-neutral-400 text-[11px] whitespace-nowrap">
                      {stmt.meterNumber}
                    </td>
                    <td className="py-2 px-3 text-right text-neutral-300 tabular-nums whitespace-nowrap">
                      {stmt.startReading.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={readingsState[stmt.id] ?? stmt.endReading}
                          onChange={(e) => handleReadingChange(stmt.id, e.target.value)}
                          className={`w-24 px-2 py-1 text-right bg-neutral-800 border rounded text-xs font-mono font-bold focus:outline-none transition-colors ${
                            isInvalid 
                              ? 'border-rose-500 text-rose-300 bg-rose-900/20' 
                              : 'border-neutral-700 text-white focus:border-amber-400'
                          }`}
                        />
                      </div>
                      {isInvalid && (
                        <div className="text-[10px] text-rose-400 font-sans mt-0.5">
                          Must be &ge; {stmt.startReading}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-400 tabular-nums whitespace-nowrap">
                      {units.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                      {currency}{cost.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-neutral-300 whitespace-nowrap">
                      {currency}{flatRent.toLocaleString('en-IN')}
                    </td>
                    <td className={`py-2 px-3 text-right tabular-nums whitespace-nowrap ${lastBal > 0 ? 'text-amber-400 font-semibold' : lastBal < 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
                      {lastBal > 0 ? `+${currency}${lastBal.toFixed(2)}` : lastBal < 0 ? `-${currency}${Math.abs(lastBal).toFixed(2)}` : '0.00'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white tabular-nums bg-neutral-900/60 border-x border-neutral-800 whitespace-nowrap">
                      {currency}{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                      {payment > 0 ? `${currency}${payment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold tabular-nums bg-neutral-900/60 border-l border-neutral-800 whitespace-nowrap ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {currency}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">
            Applying changes will automatically re-compute total dues and balances for all {buildingStatements.length} flats.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply All Readings</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
