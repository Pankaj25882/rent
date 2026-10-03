import React, { useState, useMemo } from 'react';
import { useProperty } from '../context/PropertyContext';
import { Flat } from '../types';
import { 
  Users, 
  Search, 
  Building2, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Home, 
  Zap, 
  X, 
  Save 
} from 'lucide-react';

export const FlatsDirectoryView: React.FC = () => {
  const { flats, buildings, selectedBuildingId, updateFlat, addFlat } = useProperty();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');

  // Edit Flat Modal state
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);

  // Add Flat Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBldId, setNewBldId] = useState<string>(buildings[0]?.id || '');
  const [newFlatNum, setNewFlatNum] = useState<string>('');
  const [newFloor, setNewFloor] = useState<number>(1);
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRent, setNewRent] = useState<number>(20000);

  const activeBuilding = buildings.find(b => b.id === selectedBuildingId);
  const currency = activeBuilding ? activeBuilding.currency : '₹';

  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      if (selectedBuildingId !== 'all' && flat.buildingId !== selectedBuildingId) {
        return false;
      }
      if (selectedFloor !== 'ALL' && flat.floor !== parseInt(selectedFloor, 10)) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchFlat = flat.flatNumber.toLowerCase().includes(q);
        const matchTenant = flat.tenantName.toLowerCase().includes(q);
        const matchPhone = flat.tenantPhone.toLowerCase().includes(q);
        const matchMeter = flat.meterNumber.toLowerCase().includes(q);
        if (!matchFlat && !matchTenant && !matchPhone && !matchMeter) {
          return false;
        }
      }
      return true;
    });
  }, [flats, selectedBuildingId, selectedFloor, searchTerm]);

  const buildingMap = useMemo(() => {
    return new Map(buildings.map(b => [b.id, b.name]));
  }, [buildings]);

  const handleSaveFlatEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlat) return;
    updateFlat(editingFlat);
    setEditingFlat(null);
  };

  const handleAddNewFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlatNum || !newTenantName) {
      alert('Please fill in Flat Number and Tenant Name');
      return;
    }
    const bld = buildings.find(b => b.id === newBldId) || buildings[0];
    const newFlat: Flat = {
      id: `${bld.id}-${newFlatNum}`,
      buildingId: bld.id,
      flatNumber: newFlatNum,
      floor: newFloor,
      tenantName: newTenantName,
      tenantPhone: newPhone || '+1 (555) 000-0000',
      tenantEmail: newEmail || 'tenant@example.com',
      baseRent: newRent,
      meterNumber: `MTR-${bld.name.slice(0, 3).toUpperCase()}-${newFlatNum}`,
      isOccupied: true,
      leaseStartDate: new Date().toISOString().split('T')[0],
    };

    addFlat(newFlat);
    setIsAddModalOpen(false);
    setNewFlatNum('');
    setNewTenantName('');
    setNewPhone('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Flats & Tenant Leases Directory</span>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono font-normal">
              {filteredFlats.length} Flats Active
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Complete inventory of all 40+ apartments across each building with assigned sub-meter IDs and base rents.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Flat</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search flat number, tenant name, phone or meter ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-800/80 border border-neutral-700/60 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Floor Filter */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Filter Floor:</span>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="ALL">All Floors</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(fl => (
              <option key={fl} value={fl}>Floor {fl}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Flats Grid Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-800/80 text-neutral-300 border-b border-neutral-800 text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">Building</th>
                <th className="py-3 px-3 whitespace-nowrap">Flat #</th>
                <th className="py-3 px-3 whitespace-nowrap">Floor</th>
                <th className="py-3 px-4 whitespace-nowrap">Resident Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Contact Phone & Email</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Electric Meter Serial</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Base Monthly Rent</th>
                <th className="py-3 px-3 whitespace-nowrap">Lease Start</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Occupancy</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400">
                    No flats match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr key={flat.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-3.5 font-medium text-neutral-300 whitespace-nowrap">
                      {buildingMap.get(flat.buildingId) || flat.buildingId}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-white">
                      #{flat.flatNumber}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-neutral-400 font-mono">
                      Floor {flat.floor}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-white">
                      {flat.tenantName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-400">
                      <div className="font-mono text-[11px] text-neutral-300">{flat.tenantPhone}</div>
                      <div className="text-[11px] text-neutral-400">{flat.tenantEmail}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono text-amber-400 text-xs">
                      {flat.meterNumber}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-neutral-200">
                      {currency}{flat.baseRent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                      {flat.leaseStartDate}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Occupied
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setEditingFlat({ ...flat })}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                        title="Edit Flat or Tenant Info"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Flat Modal */}
      {editingFlat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Edit Flat #{editingFlat.flatNumber}</h2>
              <button
                onClick={() => setEditingFlat(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFlatEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 font-medium block mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={editingFlat.tenantName}
                  onChange={(e) => setEditingFlat({ ...editingFlat, tenantName: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Tenant Phone</label>
                <input
                  type="text"
                  value={editingFlat.tenantPhone}
                  onChange={(e) => setEditingFlat({ ...editingFlat, tenantPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Tenant Email</label>
                <input
                  type="email"
                  value={editingFlat.tenantEmail}
                  onChange={(e) => setEditingFlat({ ...editingFlat, tenantEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Monthly Base Rent ({currency})</label>
                <input
                  type="number"
                  value={editingFlat.baseRent}
                  onChange={(e) => setEditingFlat({ ...editingFlat, baseRent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFlat(null)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Flat Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Add Apartment Flat</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewFlat} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 font-medium block mb-1">Building</label>
                <select
                  value={newBldId}
                  onChange={(e) => setNewBldId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Flat Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 805"
                    value={newFlatNum}
                    onChange={(e) => setNewFlatNum(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newFloor}
                    onChange={(e) => setNewFloor(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Tenant Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Daniel Taylor"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Monthly Rent ({currency})</label>
                  <input
                    type="number"
                    value={newRent}
                    onChange={(e) => setNewRent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Create Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
