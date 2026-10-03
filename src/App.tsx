import React, { useState } from 'react';
import { PropertyProvider, useProperty } from './context/PropertyContext';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ElectricityBillingView } from './components/ElectricityBillingView';
import { MaintenanceView } from './components/MaintenanceView';
import { FlatsDirectoryView } from './components/FlatsDirectoryView';
import { BuildingExpensesView } from './components/BuildingExpensesView';
import { BatchMeterEntryModal } from './components/BatchMeterEntryModal';
import { AddElectricityModal } from './components/AddElectricityModal';
import { PaymentModal } from './components/PaymentModal';
import { InvoiceModal } from './components/InvoiceModal';
import { NewTicketModal } from './components/NewTicketModal';
import { SettingsModal } from './components/SettingsModal';
import { FlatMonthlyStatement } from './types';

const MainAppContent: React.FC = () => {
  const { buildings, selectedBuildingId } = useProperty();

  const [activeTab, setActiveTab] = useState<ActiveTab>('billing'); // Open directly on the core user request (Electricity & Billing)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBatchMeterOpen, setIsBatchMeterOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isAddElectricityOpen, setIsAddElectricityOpen] = useState(false);
  const [selectedElectricityStatement, setSelectedElectricityStatement] = useState<FlatMonthlyStatement | null>(null);

  const [selectedInvoiceStatement, setSelectedInvoiceStatement] = useState<FlatMonthlyStatement | null>(null);
  const [selectedPaymentStatement, setSelectedPaymentStatement] = useState<FlatMonthlyStatement | null>(null);

  const activeBuilding = buildings.find(b => b.id === (selectedInvoiceStatement?.buildingId || selectedBuildingId));

  const handleOpenAddElectricity = (stmt?: FlatMonthlyStatement) => {
    setSelectedElectricityStatement(stmt || null);
    setIsAddElectricityOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 3-Zone Clean Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBatchReadings={() => setIsBatchMeterOpen(true)}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        onOpenAddElectricity={() => handleOpenAddElectricity()}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openBatchReadings={() => setIsBatchMeterOpen(true)}
          onOpenAddElectricity={() => handleOpenAddElectricity()}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setActiveTab}
              onOpenBatchReadings={() => setIsBatchMeterOpen(true)}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
            />
          )}

          {activeTab === 'billing' && (
            <ElectricityBillingView
              onSelectStatementForInvoice={(stmt) => setSelectedInvoiceStatement(stmt)}
              onSelectStatementForPayment={(stmt) => setSelectedPaymentStatement(stmt)}
              onOpenBatchReadings={() => setIsBatchMeterOpen(true)}
              onOpenAddElectricity={(stmt) => handleOpenAddElectricity(stmt)}
            />
          )}

          {activeTab === 'expenses' && (
            <BuildingExpensesView />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
            />
          )}

          {activeTab === 'directory' && (
            <FlatsDirectoryView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddElectricityModal
        isOpen={isAddElectricityOpen}
        onClose={() => {
          setIsAddElectricityOpen(false);
          setSelectedElectricityStatement(null);
        }}
        preSelectedStatement={selectedElectricityStatement}
      />

      <BatchMeterEntryModal
        isOpen={isBatchMeterOpen}
        onClose={() => setIsBatchMeterOpen(false)}
      />

      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PaymentModal
        statement={selectedPaymentStatement}
        onClose={() => setSelectedPaymentStatement(null)}
      />

      <InvoiceModal
        statement={selectedInvoiceStatement}
        building={activeBuilding}
        onClose={() => setSelectedInvoiceStatement(null)}
      />

    </div>
  );
};

export default function App() {
  return (
    <PropertyProvider>
      <MainAppContent />
    </PropertyProvider>
  );
}
