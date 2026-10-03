import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Building, 
  Flat, 
  FlatMonthlyStatement, 
  MaintenanceRequest, 
  PaymentReceipt,
  BuildingExpense,
  MaintenanceStatus,
  CurrencySymbol
} from '../types';
import { 
  INITIAL_BUILDINGS, 
  generateInitialFlats, 
  generateInitialStatements, 
  generateInitialBuildingExpenses,
  INITIAL_MAINTENANCE_REQUESTS 
} from '../data/mockData';

interface PropertyContextType {
  buildings: Building[];
  flats: Flat[];
  statements: FlatMonthlyStatement[];
  buildingExpenses: BuildingExpense[];
  maintenanceRequests: MaintenanceRequest[];
  selectedBuildingId: string;
  setSelectedBuildingId: (id: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  
  // Electricity & Billing Actions
  updateElectricityReading: (statementId: string, startReading: number, endReading: number) => void;
  batchUpdateReadings: (updates: { statementId: string; endReading: number; startReading?: number }[]) => void;
  recordPayment: (
    statementId: string, 
    amount: number, 
    method: PaymentReceipt['method'], 
    referenceNo: string, 
    note?: string
  ) => void;
  
  // Building Operating Expenses Actions
  addBuildingExpense: (expense: Omit<BuildingExpense, 'id'>) => void;
  updateBuildingExpense: (expense: BuildingExpense) => void;
  deleteBuildingExpense: (id: string) => void;

  // Building & Flat Configuration
  updateBuildingRates: (
    buildingId: string, 
    rates: { 
      electricityRatePerUnit: number; 
      fixedMeterCharge: number; 
      currency?: CurrencySymbol;
    }
  ) => void;
  addBuilding: (building: Building) => void;
  addFlat: (flat: Flat) => void;
  updateFlat: (flat: Flat) => void;
  
  // Maintenance Actions
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id' | 'ticketNumber' | 'reportedDate'>) => void;
  updateMaintenanceStatus: (
    id: string, 
    status: MaintenanceStatus, 
    resolutionNotes?: string, 
    actualCost?: number
  ) => void;
  
  // Utilities & Export
  resetToSampleData: () => void;
  exportToCSV: () => void;
  exportExpensesCSV: () => void;
  exportMaintenanceCSV: () => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUILDINGS: 'estatevolt_buildings_v3',
  FLATS: 'estatevolt_flats_v3',
  STATEMENTS: 'estatevolt_statements_v3',
  EXPENSES: 'estatevolt_expenses_v3',
  MAINTENANCE: 'estatevolt_maintenance_v3',
};

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Buildings
  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BUILDINGS;
  });

  // Initialize Flats
  const [flats, setFlats] = useState<Flat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLATS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateInitialFlats(INITIAL_BUILDINGS);
  });

  // Initialize Statements (Tenant Rent + Electricity + Previous Balance)
  const [statements, setStatements] = useState<FlatMonthlyStatement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATEMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const initialFlats = generateInitialFlats(INITIAL_BUILDINGS);
    return generateInitialStatements(INITIAL_BUILDINGS, initialFlats);
  });

  // Initialize Full Building Operating Expenses
  const [buildingExpenses, setBuildingExpenses] = useState<BuildingExpense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateInitialBuildingExpenses(INITIAL_BUILDINGS);
  });

  // Initialize Maintenance Requests
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MAINTENANCE_REQUESTS;
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLATS, JSON.stringify(flats));
  }, [flats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(statements));
  }, [statements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(buildingExpenses));
  }, [buildingExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenanceRequests));
  }, [maintenanceRequests]);

  // Recalculate statement figures (Strictly Rent + Electricity + Last Month Balance)
  const recalculateStatement = (
    stmt: FlatMonthlyStatement, 
    startReading: number, 
    endReading: number,
    customRate?: number,
    customFixedCharge?: number
  ): FlatMonthlyStatement => {
    const rate = customRate !== undefined ? customRate : stmt.ratePerUnit;
    const fixedFee = customFixedCharge !== undefined ? customFixedCharge : stmt.fixedUtilityCharge;
    
    // Total kWh consumed in the month
    const totalReading = Math.max(0, Number((endReading - startReading).toFixed(2)));
    const electricityAmount = Number((totalReading * rate + fixedFee).toFixed(2));
    
    // Total Due = Last Month Arrears + Current Base Rent + Current Electricity Bill
    const totalDue = Number((stmt.lastMonthBalance + stmt.baseRent + electricityAmount).toFixed(2));
    const balanceThisMonth = Number((totalDue - stmt.paymentReceived).toFixed(2));

    let status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' = 'UNPAID';
    if (balanceThisMonth <= 0) {
      status = 'PAID';
    } else if (stmt.paymentReceived > 0) {
      status = 'PARTIAL';
    } else if (stmt.lastMonthBalance > 0) {
      status = 'OVERDUE';
    } else {
      status = 'UNPAID';
    }

    return {
      ...stmt,
      startReading,
      endReading,
      totalReading,
      ratePerUnit: rate,
      fixedUtilityCharge: fixedFee,
      electricityAmount,
      totalDue,
      balanceThisMonth,
      status,
    };
  };

  // Update a single electricity reading
  const updateElectricityReading = (statementId: string, startReading: number, endReading: number) => {
    setStatements(prev => prev.map(stmt => {
      if (stmt.id === statementId) {
        return recalculateStatement(stmt, startReading, endReading);
      }
      return stmt;
    }));
  };

  // Bulk / batch update electricity readings
  const batchUpdateReadings = (updates: { statementId: string; endReading: number; startReading?: number }[]) => {
    const updateMap = new Map(updates.map(u => [u.statementId, u]));
    setStatements(prev => prev.map(stmt => {
      const update = updateMap.get(stmt.id);
      if (update) {
        const start = update.startReading !== undefined ? update.startReading : stmt.startReading;
        return recalculateStatement(stmt, start, update.endReading);
      }
      return stmt;
    }));
  };

  // Record a payment receipt
  const recordPayment = (
    statementId: string, 
    amount: number, 
    method: PaymentReceipt['method'], 
    referenceNo: string, 
    note?: string
  ) => {
    setStatements(prev => prev.map(stmt => {
      if (stmt.id === statementId) {
        const newPayment: PaymentReceipt = {
          id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          flatId: stmt.flatId,
          buildingId: stmt.buildingId,
          month: stmt.month,
          amount,
          date: new Date().toISOString().split('T')[0],
          method,
          referenceNo: referenceNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          note,
        };

        const updatedPayments = [...stmt.payments, newPayment];
        const newPaymentReceived = Number((stmt.paymentReceived + amount).toFixed(2));
        const newBalanceThisMonth = Number((stmt.totalDue - newPaymentReceived).toFixed(2));

        let status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' = 'UNPAID';
        if (newBalanceThisMonth <= 0) {
          status = 'PAID';
        } else if (newPaymentReceived > 0) {
          status = 'PARTIAL';
        } else if (stmt.lastMonthBalance > 0) {
          status = 'OVERDUE';
        } else {
          status = 'UNPAID';
        }

        return {
          ...stmt,
          paymentReceived: newPaymentReceived,
          balanceThisMonth: newBalanceThisMonth,
          status,
          payments: updatedPayments,
        };
      }
      return stmt;
    }));
  };

  // Building Operating Expenses CRUD
  const addBuildingExpense = (expense: Omit<BuildingExpense, 'id'>) => {
    const newExpense: BuildingExpense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setBuildingExpenses(prev => [newExpense, ...prev]);
  };

  const updateBuildingExpense = (expense: BuildingExpense) => {
    setBuildingExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
  };

  const deleteBuildingExpense = (id: string) => {
    setBuildingExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Update building rates and apply to matching statements
  const updateBuildingRates = (
    buildingId: string, 
    rates: { 
      electricityRatePerUnit: number; 
      fixedMeterCharge: number; 
      currency?: CurrencySymbol;
    }
  ) => {
    setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, ...rates } : b));

    // Recalculate existing statements for that building
    setStatements(prev => prev.map(stmt => {
      if (stmt.buildingId === buildingId) {
        const totalReading = stmt.totalReading;
        const electricityAmount = Number((totalReading * rates.electricityRatePerUnit + rates.fixedMeterCharge).toFixed(2));
        const totalDue = Number((stmt.lastMonthBalance + stmt.baseRent + electricityAmount).toFixed(2));
        const balanceThisMonth = Number((totalDue - stmt.paymentReceived).toFixed(2));
        
        let status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' = 'UNPAID';
        if (balanceThisMonth <= 0) {
          status = 'PAID';
        } else if (stmt.paymentReceived > 0) {
          status = 'PARTIAL';
        } else if (stmt.lastMonthBalance > 0) {
          status = 'OVERDUE';
        } else {
          status = 'UNPAID';
        }

        return {
          ...stmt,
          ratePerUnit: rates.electricityRatePerUnit,
          fixedUtilityCharge: rates.fixedMeterCharge,
          electricityAmount,
          totalDue,
          balanceThisMonth,
          status,
        };
      }
      return stmt;
    }));
  };

  const addBuilding = (building: Building) => {
    setBuildings(prev => [...prev, building]);
  };

  const addFlat = (flat: Flat) => {
    setFlats(prev => [...prev, flat]);
    const bld = buildings.find(b => b.id === flat.buildingId);
    if (bld) {
      const rate = bld.electricityRatePerUnit;
      const fixedFee = bld.fixedMeterCharge;
      const baseStart = 1000;
      const endReading = 1000;
      const totalReading = 0;
      const electricityAmount = fixedFee;
      const totalDue = flat.baseRent + electricityAmount;

      const newStmt: FlatMonthlyStatement = {
        id: `stmt-${flat.id}-${selectedMonth}`,
        flatId: flat.id,
        buildingId: flat.buildingId,
        month: selectedMonth,
        buildingName: bld.name,
        flatNumber: flat.flatNumber,
        tenantName: flat.tenantName,
        tenantPhone: flat.tenantPhone,
        tenantEmail: flat.tenantEmail,
        meterNumber: flat.meterNumber,
        baseRent: flat.baseRent,
        lastMonthBalance: 0,
        startReading: baseStart,
        endReading,
        totalReading,
        ratePerUnit: rate,
        fixedUtilityCharge: fixedFee,
        electricityAmount,
        totalDue,
        paymentReceived: 0,
        balanceThisMonth: totalDue,
        status: 'UNPAID',
        payments: [],
      };
      setStatements(prev => [...prev, newStmt]);
    }
  };

  const updateFlat = (flat: Flat) => {
    setFlats(prev => prev.map(f => f.id === flat.id ? flat : f));
    setStatements(prev => prev.map(stmt => {
      if (stmt.flatId === flat.id) {
        return {
          ...stmt,
          flatNumber: flat.flatNumber,
          tenantName: flat.tenantName,
          tenantPhone: flat.tenantPhone,
          tenantEmail: flat.tenantEmail,
          baseRent: flat.baseRent,
        };
      }
      return stmt;
    }));
  };

  // Add maintenance request
  const addMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'ticketNumber' | 'reportedDate'>) => {
    const nextTicketNum = `MNT-${1000 + maintenanceRequests.length + 1}`;
    const newReq: MaintenanceRequest = {
      ...request,
      id: `mnt-${Date.now()}`,
      ticketNumber: nextTicketNum,
      reportedDate: new Date().toISOString().split('T')[0],
    };
    setMaintenanceRequests(prev => [newReq, ...prev]);
  };

  const updateMaintenanceStatus = (
    id: string, 
    status: MaintenanceStatus, 
    resolutionNotes?: string, 
    actualCost?: number
  ) => {
    setMaintenanceRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status,
          ...(resolutionNotes ? { resolutionNotes } : {}),
          ...(actualCost !== undefined ? { actualCost } : {}),
          ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolvedDate: new Date().toISOString().split('T')[0] } : {})
        };
      }
      return req;
    }));
  };

  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.BUILDINGS);
    localStorage.removeItem(STORAGE_KEYS.FLATS);
    localStorage.removeItem(STORAGE_KEYS.STATEMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);

    const initialBuildings = INITIAL_BUILDINGS;
    const initialFlats = generateInitialFlats(initialBuildings);
    const initialStmts = generateInitialStatements(initialBuildings, initialFlats);
    const initialExpenses = generateInitialBuildingExpenses(initialBuildings);
    
    setBuildings(initialBuildings);
    setFlats(initialFlats);
    setStatements(initialStmts);
    setBuildingExpenses(initialExpenses);
    setMaintenanceRequests(INITIAL_MAINTENANCE_REQUESTS);
  };

  const exportToCSV = () => {
    const filtered = selectedBuildingId === 'all' 
      ? statements.filter(s => s.month === selectedMonth)
      : statements.filter(s => s.buildingId === selectedBuildingId && s.month === selectedMonth);

    const headers = [
      'Building Name',
      'Flat Number',
      'Tenant Name',
      'Billing Month',
      'Meter Number',
      'Start Reading (kWh)',
      'End Reading (kWh)',
      'Total Reading (kWh)',
      'Rate Per Unit',
      'Fixed Meter Fee',
      'Electricity Cost',
      'Rent',
      'Last Month Balance',
      'Total Amount (Rent+Elec Bill+Last Month Balance)',
      'Payment',
      'Balance (Total Amount - Payment)',
      'Status'
    ];

    const rows = filtered.map(s => [
      `"${s.buildingName}"`,
      `"${s.flatNumber}"`,
      `"${s.tenantName}"`,
      `"${s.month}"`,
      `"${s.meterNumber}"`,
      s.startReading,
      s.endReading,
      s.totalReading,
      s.ratePerUnit,
      s.fixedUtilityCharge,
      s.electricityAmount,
      s.baseRent,
      s.lastMonthBalance,
      s.totalDue,
      s.paymentReceived,
      s.balanceThisMonth,
      s.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Electricity_Rent_Billing_${selectedMonth}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExpensesCSV = () => {
    const filtered = selectedBuildingId === 'all'
      ? buildingExpenses.filter(e => e.month === selectedMonth)
      : buildingExpenses.filter(e => e.buildingId === selectedBuildingId && e.month === selectedMonth);

    const headers = [
      'Building Name',
      'Billing Month',
      'Category',
      'Title / Description',
      'Vendor / Agency',
      'Amount (INR)',
      'Date',
      'Status',
      'Invoice / Receipt Ref',
      'Notes'
    ];

    const rows = filtered.map(e => [
      `"${e.buildingName}"`,
      `"${e.month}"`,
      `"${e.category}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.vendor.replace(/"/g, '""')}"`,
      e.amount,
      e.date,
      e.status,
      `"${e.invoiceRef || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Building_Expenses_${selectedMonth}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMaintenanceCSV = () => {
    const headers = [
      'Ticket Number',
      'Building',
      'Flat Number',
      'Tenant Name',
      'Category',
      'Priority',
      'Status',
      'Title',
      'Description',
      'Reported Date',
      'Technician',
      'Phone',
      'Estimated Cost (INR)',
      'Actual Cost (INR)',
      'Resolved Date'
    ];

    const rows = maintenanceRequests.map(m => [
      `"${m.ticketNumber}"`,
      `"${m.buildingName}"`,
      `"${m.flatNumber}"`,
      `"${m.tenantName}"`,
      `"${m.category}"`,
      `"${m.priority}"`,
      `"${m.status}"`,
      `"${m.title.replace(/"/g, '""')}"`,
      `"${m.description.replace(/"/g, '""')}"`,
      m.reportedDate,
      `"${m.assignedTechnician || ''}"`,
      `"${m.technicianPhone || ''}"`,
      m.estimatedCost,
      m.actualCost,
      m.resolvedDate || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Maintenance_Requests_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PropertyContext.Provider value={{
      buildings,
      flats,
      statements,
      buildingExpenses,
      maintenanceRequests,
      selectedBuildingId,
      setSelectedBuildingId,
      selectedMonth,
      setSelectedMonth,
      updateElectricityReading,
      batchUpdateReadings,
      recordPayment,
      addBuildingExpense,
      updateBuildingExpense,
      deleteBuildingExpense,
      updateBuildingRates,
      addBuilding,
      addFlat,
      updateFlat,
      addMaintenanceRequest,
      updateMaintenanceStatus,
      resetToSampleData,
      exportToCSV,
      exportExpensesCSV,
      exportMaintenanceCSV,
    }}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
