import { useState } from 'react';

// Computed once at module load time — satisfies react-hooks/purity (no Date.now inside render)
const DEMO_LAST_VERIFIED = new Date(Date.now() - 1000 * 60 * 15).toISOString();

export function ReconciliationWorkbench() {
  const [activeTab, setActiveTab] = useState<'AR' | 'FA' | 'TAX' | 'GL'>('AR');
  const [showDiff, setShowDiff] = useState(false);

  // Mocks for UI demonstration
  const lastVerified = DEMO_LAST_VERIFIED;
  const lag = "15 minutes";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Source of Truth Hierarchy & Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-yellow-800 font-bold">⚠️ Diagnostic View Only</h3>
            <p className="text-yellow-700 text-sm mt-1">
              This panel is not authoritative. It cannot be cited in audit reports.
            </p>
            <p className="text-yellow-700 text-sm mt-1 font-mono">
              Last verified against Event Store: {lastVerified} (Lag: {lag})
            </p>
          </div>
          <div className="text-right text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
            <p className="font-bold">Source of Truth Hierarchy:</p>
            <ol className="list-decimal list-inside text-left mt-1">
              <li>Event Store (Authoritative)</li>
              <li>Ledger Tables (Materialized)</li>
              <li className="font-bold">Reconciliation UI (Diagnostic)</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="shadow-lg border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b px-6 py-4 flex flex-row space-x-4 items-center">
          <h2 className="text-xl font-semibold text-slate-800">Reconciliation Workbench</h2>
          <div className="flex space-x-2">
            <button className={`px-3 py-1.5 rounded text-xs font-semibold border ${activeTab === 'AR' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300'}`} onClick={() => { setActiveTab('AR'); setShowDiff(false); }}>Allocation Drift</button>
            <button className={`px-3 py-1.5 rounded text-xs font-semibold border ${activeTab === 'FA' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300'}`} onClick={() => { setActiveTab('FA'); setShowDiff(false); }}>Depreciation Drift</button>
            <button className={`px-3 py-1.5 rounded text-xs font-semibold border ${activeTab === 'TAX' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300'}`} onClick={() => { setActiveTab('TAX'); setShowDiff(false); }}>Tax Mismatch</button>
            <button className={`px-3 py-1.5 rounded text-xs font-semibold border ${activeTab === 'GL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300'}`} onClick={() => { setActiveTab('GL'); setShowDiff(false); }}>GL Proof</button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'AR' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-md">
                <div>
                  <h4 className="font-semibold text-red-900">AR Open Item Drift Detected</h4>
                  <p className="text-sm text-red-700 font-mono mt-1">Period: 2026-06 | Customer: CUST-901</p>
                </div>
                <div className="text-right">
                  <p className="text-red-800 font-bold">Drift: +₦50,000</p>
                  <button className="mt-2 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded" onClick={() => setShowDiff(true)}>Explore Diff</button>
                </div>
              </div>

              {showDiff && (
                <div className="border border-slate-200 rounded-md p-4 bg-white shadow-inner">
                  <h4 className="font-bold text-slate-800 border-b pb-2 mb-4">Diff Explorer: Root Cause Analysis</h4>
                  <div className="font-mono text-sm space-y-2 text-slate-600">
                    <p>Expected AR Balance: <span className="text-green-600">₦1,000,000</span></p>
                    <p>Actual AR Balance:   <span className="text-red-600">₦1,050,000</span></p>
                    <p>Difference:         <span className="text-red-600 font-bold">+₦50,000</span></p>
                    <hr className="my-4" />
                    <p>Traced to: <span className="font-bold text-blue-600">ArAllocation #AR-12881</span></p>
                    <ul className="list-disc list-inside pl-4 text-slate-500 space-y-1">
                      <li>allocationType: APPLY</li>
                      <li>sourceReceiptId: RCPT-9901</li>
                      <li>targetInvoiceId: INV-4420</li>
                      <li>amountAllocated: 50,000</li>
                      <li>allocationDate: 2026-06-28T14:32:11Z</li>
                    </ul>
                    <div className="bg-blue-50 p-3 mt-4 border border-blue-100 rounded text-blue-800">
                      <p><strong>Diagnosis:</strong> This allocation exists in ArAllocation collection but was NOT reflected in ArOpenItem #INV-4420.allocatedAmount.</p>
                      <p className="mt-2"><strong>Probable Cause:</strong> PARTIAL_CONFIRMED state — allocation committed but projection update failed before confirmation.</p>
                    <button className="mt-3 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded">Trigger Projection Rebuild for INV-4420</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'FA' && (
            <div className="p-8 text-center text-slate-500">
              <span className="inline-block mb-4 text-xs border border-slate-300 px-2 py-1 rounded text-slate-500">Healthy</span>
            </div>
          )}

          {activeTab === 'TAX' && (
            <div className="p-8 text-center text-slate-500">
              <span className="inline-block mb-4 text-xs border border-slate-300 px-2 py-1 rounded text-slate-500">Healthy</span>
            </div>
          )}

          {activeTab === 'GL' && (
            <div className="p-8 text-center text-slate-500">
              <p className="font-mono bg-slate-100 p-2 rounded inline-block text-slate-800">
                TripleLock Hash: 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4
              </p>
              <p className="mt-4 text-sm">Last verified 15 minutes ago.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReconciliationWorkbench;
