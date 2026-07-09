import { useState } from 'react';

type AllocationState = 'IDLE' | 'REVIEW_PENDING' | 'COMMITTING' | 'SUCCESS' | 'FAILED_CONFLICT' | 'PARTIAL_CONFIRMED';

interface AvailableCashDTO { receiptId: string; reference: string; unappliedAmount: number; receiptDate: string; }
interface AllocatableInvoiceDTO { invoiceId: string; invoiceNumber: string; invoiceDate: string; dueDate: string; originalAmount: number; remainingBalance: number; collectibleBalance: number; isDisputed: boolean; disputedAmount: number; }

export function CashApplicationWorkbench() {
  const [state, setState] = useState<AllocationState>('IDLE');
  const [canonicalIntentId, setCanonicalIntentId] = useState<string | null>(null);
  
  // Mocks for UI demonstration
  const receipt: AvailableCashDTO = { receiptId: 'RCPT-1', reference: 'WIRE-992', unappliedAmount: 5000, receiptDate: '2026-06-28' };
  const invoices: AllocatableInvoiceDTO[] = [
    { invoiceId: 'INV-A', invoiceNumber: 'INV-A', invoiceDate: '2026-06-01', dueDate: '2026-06-30', originalAmount: 3000, remainingBalance: 3000, collectibleBalance: 3000, isDisputed: false, disputedAmount: 0 },
    { invoiceId: 'INV-B', invoiceNumber: 'INV-B', invoiceDate: '2026-06-05', dueDate: '2026-07-05', originalAmount: 4000, remainingBalance: 4000, collectibleBalance: 4000, isDisputed: false, disputedAmount: 0 }
  ];

  const handleReview = () => {
    // Client generates canonical intent
    const intentId = `v1:client-hash-${Date.now()}`;
    setCanonicalIntentId(intentId);
    setState('REVIEW_PENDING');
  };

  const handleCommit = async () => {
    setState('COMMITTING');
    // Simulate network request
    setTimeout(() => {
      // Simulate timeout failure to show PARTIAL_CONFIRMED recovery
      setState('PARTIAL_CONFIRMED');
    }, 2000);
  };

  const handleReconcile = async () => {
    // Simulate polling GET /ar/allocations/intent/{canonicalIntentId}
    setTimeout(() => {
      setState('SUCCESS');
    }, 1000);
  };

  const badgeColor =
    state === 'SUCCESS' ? 'bg-green-100 text-green-700' :
    state === 'FAILED_CONFLICT' ? 'bg-red-100 text-red-700' :
    state === 'PARTIAL_CONFIRMED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="w-full max-w-4xl mx-auto shadow-lg border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Cash Application Workbench</h2>
          <span className={`text-xs font-bold px-2 py-1 rounded ${badgeColor}`}>{state}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Receipt {receipt.reference}</h3>
            <p className="text-sm text-blue-700">Unapplied: ₦{receipt.unappliedAmount.toLocaleString()}</p>
          </div>
        </div>

        {state === 'IDLE' && (
          <div className="space-y-4">
            <h3 className="font-medium text-slate-700">Select Invoices to Apply</h3>
            {invoices.map(inv => (
              <div key={inv.invoiceId} className="flex justify-between items-center p-3 border rounded-md">
                <span>{inv.invoiceNumber} (Due: {inv.dueDate})</span>
                <span>Bal: ₦{inv.collectibleBalance.toLocaleString()}</span>
              </div>
            ))}
            <button onClick={handleReview} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">Review Allocation</button>
          </div>
        )}

        {state === 'REVIEW_PENDING' && (
          <div className="space-y-4">
            <h3 className="font-medium text-slate-700">Confirm Allocation</h3>
            <div className="p-4 bg-slate-50 border rounded-md text-sm text-slate-600">
              Allocating ₦5,000 across 2 invoices. Intent ID: {canonicalIntentId}
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setState('IDLE')} className="w-1/2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleCommit} className="w-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">Confirm &amp; Post</button>
            </div>
          </div>
        )}

        {state === 'COMMITTING' && (
          <div className="text-center py-8 text-slate-500 animate-pulse">
            Posting to ledger... Please wait.
          </div>
        )}

        {state === 'PARTIAL_CONFIRMED' && (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-md text-center space-y-4">
            <h3 className="text-orange-800 font-semibold text-lg">Network Timeout</h3>
            <p className="text-orange-700 text-sm">
              The request timed out, but the server may have processed your allocation. 
              Checking intent <span className="font-mono bg-orange-100 px-1">{canonicalIntentId}</span>...
            </p>
            <button onClick={handleReconcile} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium">
              Verify Status
            </button>
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-md text-center space-y-2">
            <h3 className="text-green-800 font-semibold text-lg">Allocation Successful</h3>
            <p className="text-green-700 text-sm">Receipt fully applied to 2 invoices.</p>
            <button onClick={() => setState('IDLE')} className="mt-4 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Process Next Receipt</button>
          </div>
        )}

        {state === 'FAILED_CONFLICT' && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-md space-y-4">
            <h3 className="text-red-800 font-semibold text-lg">Version Conflict Detected</h3>
            <p className="text-red-700 text-sm">
              Another user allocated cash to INV-A while you were working. 
              The balance has changed from ₦3,000 to ₦1,000.
            </p>
            <button onClick={() => setState('IDLE')} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">
              Refresh Balances &amp; Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CashApplicationWorkbench;
