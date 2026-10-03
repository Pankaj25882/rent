import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { FlatMonthlyStatement, PaymentReceipt } from '../types';
import { CreditCard, X, Check, DollarSign, Building2, User, Calendar } from 'lucide-react';

interface PaymentModalProps {
  statement: FlatMonthlyStatement | null;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ statement, onClose }) => {
  const { recordPayment, buildings } = useProperty();

  const [amount, setAmount] = useState<number>(() => {
    return statement ? Math.max(0, statement.balanceThisMonth) : 0;
  });

  const [method, setMethod] = useState<PaymentReceipt['method']>('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState<string>(() => {
    return `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  });
  const [note, setNote] = useState<string>('Monthly settlement (Rent + Electricity)');

  if (!statement) return null;

  const building = buildings.find(b => b.id === statement.buildingId);
  const currency = building ? building.currency : '₹';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Payment amount must be greater than 0.');
      return;
    }

    recordPayment(
      statement.id,
      amount,
      method,
      referenceNo,
      note
    );

    alert(`Payment of ${currency}${amount.toFixed(2)} recorded for Flat #${statement.flatNumber} (${statement.tenantName})!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Resident Payment</h2>
              <p className="text-xs text-neutral-400">
                Update payment receipt & reduce outstanding balance
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

        {/* Resident & Account Brief */}
        <div className="px-6 py-4 bg-neutral-950/60 border-b border-neutral-800 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-neutral-400 block">Flat & Building</span>
            <span className="font-semibold text-white">Flat #{statement.flatNumber} · {statement.buildingName}</span>
          </div>
          <div>
            <span className="text-neutral-400 block">Tenant Name</span>
            <span className="font-semibold text-neutral-200">{statement.tenantName}</span>
          </div>
          <div>
            <span className="text-neutral-400 block">Total Due This Month</span>
            <span className="font-mono font-bold text-neutral-200">
              {currency}{statement.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block">Current Balance Outstanding</span>
            <span className="font-mono font-bold text-rose-400">
              {currency}{statement.balanceThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-neutral-300 font-medium">Payment Amount ({currency})</label>
              <button
                type="button"
                onClick={() => setAmount(Math.max(0, statement.balanceThisMonth))}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                Set Full Balance ({currency}{Math.max(0, statement.balanceThisMonth).toFixed(2)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-neutral-300 font-medium block mb-1.5">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-500"
            >
              <option value="BANK_TRANSFER">Bank Direct Transfer / ACH</option>
              <option value="UPI_WIRE">UPI / Wire Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Cheque</option>
              <option value="CARD">Credit / Debit Card</option>
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-neutral-300 font-medium block mb-1.5">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none"
              placeholder="e.g. TXN-94821 or Cash Receipt #12"
              required
            />
          </div>

          {/* Note / Memo */}
          <div>
            <label className="text-neutral-300 font-medium block mb-1.5">
              Receipt Notes (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none"
              placeholder="Notes on payment receipt"
            />
          </div>

          {/* Balance Preview after payment */}
          <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Remaining Balance After Payment:</span>
            <span className={`font-bold ${
              statement.balanceThisMonth - amount <= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {currency}{Math.max(0, statement.balanceThisMonth - amount).toFixed(2)}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Confirm & Post Receipt
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
