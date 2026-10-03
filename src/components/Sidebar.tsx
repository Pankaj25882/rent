import React from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Wallet,
  Wrench, 
  Users, 
  Zap, 
  Building2,
  ShieldCheck,
  CreditCard,
  Receipt
} from 'lucide-react';
import { useProperty } from '../context/PropertyContext';

export type ActiveTab = 'dashboard' | 'billing' | 'expenses' | 'maintenance' | 'directory';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openBatchReadings: () => void;
  onOpenAddRent?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  openBatchReadings,
  onOpenAddRent
}) => {
  const { statements, buildingExpenses, maintenanceRequests, buildings, selectedBuildingId, selectedMonth } = useProperty();

  // Badge counts
  const filteredStmts = selectedBuildingId === 'all'
    ? statements.filter(s => s.month === selectedMonth)
    : statements.filter(s => s.buildingId === selectedBuildingId && s.month === selectedMonth);

  const pendingPaymentsCount = filteredStmts.filter(s => s.balanceThisMonth > 0).length;
  
  const filteredExpenses = selectedBuildingId === 'all'
    ? buildingExpenses.filter(e => e.month === selectedMonth)
    : buildingExpenses.filter(e => e.buildingId === selectedBuildingId && e.month === selectedMonth);

  const pendingExpensesCount = filteredExpenses.filter(e => e.status === 'PENDING').length;

  const filteredRequests = selectedBuildingId === 'all'
    ? maintenanceRequests
    : maintenanceRequests.filter(m => m.buildingId === selectedBuildingId);

  const activeTicketsCount = filteredRequests.filter(m => m.status === 'NEW' || m.status === 'IN_PROGRESS' || m.status === 'WAITING_PARTS').length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Overview & Analytics',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'billing',
      label: 'Rent Ledger',
      icon: <ReceiptText className="w-4 h-4" />,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Due` : undefined,
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      id: 'expenses',
      label: 'Building Expenses',
      icon: <Wallet className="w-4 h-4" />,
      badge: pendingExpensesCount > 0 ? `${pendingExpensesCount} Pending` : undefined,
      badgeColor: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    },
    {
      id: 'maintenance',
      label: 'Maintenance Tickets',
      icon: <Wrench className="w-4 h-4" />,
      badge: activeTicketsCount > 0 ? `${activeTicketsCount} Active` : undefined,
      badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    },
    {
      id: 'directory',
      label: 'Flats & Residents',
      icon: <Users className="w-4 h-4" />,
      badge: `${filteredStmts.length}`,
      badgeColor: 'text-neutral-400 bg-neutral-800 border-neutral-700',
    },
  ];

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-61px)] no-print">
      <div className="p-4 space-y-6">
        
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Operations
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-emerald-400' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${item.badgeColor || 'text-neutral-400 bg-neutral-800'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Utility Feature Card */}
        <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Zap className="w-4 h-4" />
            <span>Monthly Meter Reading</span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Record end-of-month meter readings for all 40+ flats in one rapid spreadsheet view.
          </p>
          <div className="space-y-1.5 pt-1">
            {onOpenAddRent && (
              <button
                onClick={onOpenAddRent}
                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5 text-neutral-950" />
                <span>+ Add Rent</span>
              </button>
            )}
            <button
              onClick={openBatchReadings}
              className="w-full py-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition-colors cursor-pointer text-center"
            >
              Batch Meter Grid (40+ Flats)
            </button>
          </div>
        </div>

        {/* Building List summary */}
        <div className="space-y-2">
          <p className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Managed Properties
          </p>
          <div className="space-y-1">
            {buildings.map(b => (
              <div 
                key={b.id} 
                className="px-3 py-2 rounded-lg bg-neutral-900/60 border border-neutral-800/80 text-xs"
              >
                <div className="flex items-center justify-between font-medium text-neutral-200">
                  <span className="truncate">{b.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400">{b.totalFlats} units</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-0.5 font-mono">
                  <span>Tariff: {b.currency}{b.electricityRatePerUnit}/kWh</span>
                  <span>Meter: {b.currency}{b.fixedMeterCharge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer system info */}
      <div className="p-4 border-t border-neutral-800 text-[11px] text-neutral-400">
        <div className="flex items-center justify-between">
          <span>Currency Mode</span>
          <span className="font-mono text-neutral-200 font-semibold">INR (₹)</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Full Building P&L Active</span>
        </div>
      </div>
    </aside>
  );
};
