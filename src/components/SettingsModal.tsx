import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { Building, CurrencySymbol } from '../types';
import { Settings, X, Save, Zap, Building2, Plus, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { buildings, updateBuildingRates, addBuilding } = useProperty();

  const [selectedBldId, setSelectedBldId] = useState<string>(buildings[0]?.id || '');
  const activeBuilding = buildings.find(b => b.id === selectedBldId) || buildings[0];

  const [ratePerUnit, setRatePerUnit] = useState<number>(activeBuilding?.electricityRatePerUnit || 9.0);
  const [fixedMeterFee, setFixedMeterFee] = useState<number>(activeBuilding?.fixedMeterCharge || 100);
  const [currency, setCurrency] = useState<CurrencySymbol>(activeBuilding?.currency || '₹');

  // Add building form state
  const [showAddBld, setShowAddBld] = useState(false);
  const [newBldName, setNewBldName] = useState('');
  const [newBldAddress, setNewBldAddress] = useState('');
  const [newBldFloors, setNewBldFloors] = useState(7);
  const [newBldFlats, setNewBldFlats] = useState(42);

  if (!isOpen) return null;

  const handleSelectBuilding = (bldId: string) => {
    setSelectedBldId(bldId);
    const b = buildings.find(item => item.id === bldId);
    if (b) {
      setRatePerUnit(b.electricityRatePerUnit);
      setFixedMeterFee(b.fixedMeterCharge);
      setCurrency(b.currency);
    }
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBuilding) return;

    updateBuildingRates(activeBuilding.id, {
      electricityRatePerUnit: ratePerUnit,
      fixedMeterCharge: fixedMeterFee,
      currency,
    });

    alert(`Electricity tariff updated for ${activeBuilding.name}! All apartment bills have been recalculated automatically.`);
    onClose();
  };

  const handleCreateBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBldName.trim()) {
      alert('Please enter a building name.');
      return;
    }

    const newBuilding: Building = {
      id: `bld-${Date.now()}`,
      name: newBldName,
      address: newBldAddress || 'Metro City Residential Area',
      totalFloors: newBldFloors,
      totalFlats: newBldFlats,
      electricityRatePerUnit: ratePerUnit,
      fixedMeterCharge: fixedMeterFee,
      currency,
    };

    addBuilding(newBuilding);
    setShowAddBld(false);
    setSelectedBldId(newBuilding.id);
    alert(`Building "${newBldName}" added with ${newBldFlats} flats capacity!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-200 border border-neutral-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Utility Tariff & Building Configuration</h2>
              <p className="text-xs text-neutral-400">
                Pre-define electricity rate per unit, fixed sub-meter charge, and currency symbol
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

        {/* Building selector tabs */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            {buildings.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelectBuilding(b.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedBldId === b.id
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddBld(prev => !prev)}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Building</span>
          </button>
        </div>

        {/* Add Building Form */}
        {showAddBld && (
          <form onSubmit={handleCreateBuilding} className="p-6 border-b border-neutral-800 bg-neutral-950/80 space-y-3 text-xs">
            <h3 className="font-bold text-white text-xs">Register New Residential Property</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 block mb-1">Building Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lotus Heights"
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Total Apartments</label>
                <input
                  type="number"
                  value={newBldFlats}
                  onChange={(e) => setNewBldFlats(parseInt(e.target.value, 10) || 40)}
                  className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-neutral-300 block mb-1">Address</label>
              <input
                type="text"
                placeholder="Street address..."
                value={newBldAddress}
                onChange={(e) => setNewBldAddress(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddBld(false)}
                className="px-3 py-1 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
              >
                Add Building
              </button>
            </div>
          </form>
        )}

        {/* Rate Configuration Form */}
        <form onSubmit={handleSaveRates} className="p-6 space-y-4 text-xs">
          
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Configuring Rates For:</span>
            <span className="font-bold text-white font-mono">{activeBuilding?.name} ({activeBuilding?.totalFlats} flats)</span>
          </div>

          {/* Electricity Tariff per unit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-neutral-200 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Electricity Tariff Rate (per kWh unit)</span>
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                Formula: Units × Rate
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">
                {currency}
              </span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Example: ₹9.00 means 250 units consumption equals ₹2,250.00.
            </p>
          </div>

          {/* Fixed Meter Base Charge & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-300 font-medium block mb-1">
                Fixed Sub-Meter Line Charge ({currency})
              </label>
              <input
                type="number"
                step="10"
                value={fixedMeterFee}
                onChange={(e) => setFixedMeterFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5">Monthly meter service charge</span>
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1">
                Unit of Measurement / Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="AED">AED (Dirham)</option>
              </select>
            </div>
          </div>

          {/* Live Bill Calculation Sample Preview */}
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
            <span className="text-neutral-400 font-semibold block text-[11px]">
              Live Automated Calculation Preview (Sample 250 kWh usage):
            </span>
            <div className="font-mono text-xs text-neutral-300 space-y-0.5">
              <div className="flex justify-between">
                <span>250 units × {currency}{ratePerUnit}/unit:</span>
                <span>{currency}{(250 * ratePerUnit).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>+ Fixed Meter Fee:</span>
                <span>{currency}{fixedMeterFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-neutral-800">
                <span>Total Electricity Bill:</span>
                <span>{currency}{(250 * ratePerUnit + fixedMeterFee).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold shadow-sm"
            >
              Save & Recalculate Bills
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
