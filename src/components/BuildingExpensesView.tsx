import React, { useState, useMemo } from 'react';
import { useProperty } from '../context/PropertyContext';
import { BuildingExpense, ExpenseCategory } from '../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Receipt, 
  Zap, 
  Shield, 
  Sparkles, 
  ArrowUpRight, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export const BuildingExpensesView: React.FC = () => {
  const { 
    buildingExpenses, 
    buildings, 
    selectedBuildingId, 
    selectedMonth,
    addBuildingExpense,
    deleteBuildingExpense,
    exportExpensesCSV 
  } = useProperty();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBldId, setNewBldId] = useState<string>(
    selectedBuildingId === 'all' ? (buildings[0]?.id || '') : selectedBuildingId
  );
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('COMMON_ELECTRICITY');
  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newAmount, setNewAmount] = useState<number>(15000);
  const [newStatus, setNewStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [newInvoiceRef, setNewInvoiceRef] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const activeBuilding = buildings.find(b => b.id === selectedBuildingId);
  const currency = activeBuilding ? activeBuilding.currency : '₹';

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return buildingExpenses.filter((exp) => {
      if (selectedBuildingId !== 'all' && exp.buildingId !== selectedBuildingId) {
        return false;
      }
      if (exp.month !== selectedMonth) {
        return false;
      }
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && exp.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchVendor = exp.vendor.toLowerCase().includes(q);
        const matchRef = (exp.invoiceRef || '').toLowerCase().includes(q);
        const matchBld = exp.buildingName.toLowerCase().includes(q);
        if (!matchTitle && !matchVendor && !matchRef && !matchBld) {
          return false;
        }
      }
      return true;
    });
  }, [buildingExpenses, selectedBuildingId, selectedMonth, categoryFilter, statusFilter, searchTerm]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    const catMap = new Map<ExpenseCategory, number>();

    filteredExpenses.forEach(e => {
      total += e.amount;
      if (e.status === 'PAID') {
        paid += e.amount;
      } else {
        pending += e.amount;
      }
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });

    let topCategory = 'None';
    let topCategoryAmount = 0;
    catMap.forEach((amt, cat) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat.replace(/_/g, ' ');
      }
    });

    return { total, paid, pending, topCategory, topCategoryAmount };
  }, [filteredExpenses]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newAmount <= 0) {
      alert('Please provide a valid description and amount.');
      return;
    }

    const bld = buildings.find(b => b.id === newBldId) || buildings[0];

    addBuildingExpense({
      buildingId: bld.id,
      buildingName: bld.name,
      month: selectedMonth,
      category: newCategory,
      title: newTitle,
      vendor: newVendor || 'General Contractor',
      amount: newAmount,
      date: new Date().toISOString().split('T')[0],
      status: newStatus,
      invoiceRef: newInvoiceRef || `EXP-${selectedMonth.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      notes: newNotes || undefined,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewVendor('');
    setNewAmount(10000);
    setNewInvoiceRef('');
    setNewNotes('');
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    switch (category) {
      case 'COMMON_ELECTRICITY':
        return 'Common Meter Power (Lifts & Pumps)';
      case 'SECURITY_GUARDS':
        return '24x7 Security Agency';
      case 'HOUSEKEEPING_STAFF':
        return 'Housekeeping & Sanitation';
      case 'ELEVATOR_AMC':
        return 'Elevator AMC & Servicing';
      case 'WATER_TANKERS':
        return 'Water Supply & Tankers';
      case 'GENERATOR_DIESEL':
        return 'DG Backup Fuel / Diesel';
      case 'REPAIRS_CIVIL':
        return 'Repairs & Civil Works';
      case 'PEST_CONTROL':
        return 'Pest Control & Fogging';
      default:
        return 'General Facility Operations';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Building Operating Expenses</span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-normal">
              Month: {selectedMonth}
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Track and audit monthly operations for the full building: common area electricity, security, housekeeping, lift AMC, water, and generator fuel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Building Expense</span>
          </button>

          <button
            onClick={exportExpensesCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium">
            Total Building Operating Cost
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1 tabular-nums">
            {currency}{metrics.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            For {selectedBuildingId === 'all' ? 'All Buildings' : activeBuilding?.name}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium flex items-center justify-between">
            <span>Paid Invoices</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
            {currency}{metrics.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Disbursed to vendors</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium flex items-center justify-between">
            <span>Pending Invoices</span>
            {metrics.pending > 0 && <Clock className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {currency}{metrics.pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Awaiting payout</div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium">
            Top Cost Center
          </div>
          <div className="text-sm font-bold text-neutral-200 mt-1 truncate capitalize">
            {metrics.topCategory}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
            {currency}{metrics.topCategoryAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} this month
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search vendor, invoice reference, or expense title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-800/80 border border-neutral-700/60 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="COMMON_ELECTRICITY">Common Power (Lift/Pumps)</option>
            <option value="SECURITY_GUARDS">Security Agency</option>
            <option value="HOUSEKEEPING_STAFF">Housekeeping Staff</option>
            <option value="ELEVATOR_AMC">Elevator AMC</option>
            <option value="WATER_TANKERS">Water Supply</option>
            <option value="GENERATOR_DIESEL">DG Diesel / Fuel</option>
            <option value="REPAIRS_CIVIL">Repairs & Civil</option>
            <option value="PEST_CONTROL">Pest Control</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-800/80 text-neutral-300 border-b border-neutral-800 text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">Building</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Category</th>
                <th className="py-3 px-4">Title / Description</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Vendor / Contractor</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Invoice #</th>
                <th className="py-3 px-3 whitespace-nowrap">Payment Date</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Amount (₹)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    No building expenses recorded for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-neutral-200">
                      {exp.buildingName}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-neutral-300 font-medium">
                        {getCategoryLabel(exp.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-white">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-neutral-300">
                      {exp.vendor}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-neutral-400">
                      {exp.invoiceRef || '-'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-400">
                      {exp.date}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-white text-xs whitespace-nowrap">
                      {currency}{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold ${
                        exp.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {exp.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm(`Delete expense "${exp.title}"?`)) {
                            deleteBuildingExpense(exp.id);
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-400 rounded transition-colors"
                        title="Delete Expense Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Record Full Building Expense</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Expense Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  >
                    <option value="COMMON_ELECTRICITY">Common Area Electricity</option>
                    <option value="SECURITY_GUARDS">24x7 Security Guards</option>
                    <option value="HOUSEKEEPING_STAFF">Housekeeping & Cleaning</option>
                    <option value="ELEVATOR_AMC">Elevator AMC</option>
                    <option value="WATER_TANKERS">Water Tanker Supply</option>
                    <option value="GENERATOR_DIESEL">DG Generator Diesel</option>
                    <option value="REPAIRS_CIVIL">Repairs & Civil Work</option>
                    <option value="PEST_CONTROL">Pest Control & Gardening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Expense Title / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Common Meter Electricity Bill for October or Guard Payroll"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Vendor / Agency</label>
                  <input
                    type="text"
                    placeholder="e.g. State Electricity Board or Guard Agency"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    step="100"
                    min="1"
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Invoice / Receipt Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-99214"
                    value={newInvoiceRef}
                    onChange={(e) => setNewInvoiceRef(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Payment Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                  >
                    <option value="PAID">Paid / Cleared</option>
                    <option value="PENDING">Pending Payout</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding service, warranty, or approval..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Building Expense
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
