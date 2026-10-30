import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';

interface EscrowEntry {
  _id: string; // storeId
  totalPricing: number; // Kobo
  totalEscrow: number; // Kobo
  variance: number; // Kobo
}

interface LedgerEntry {
  storeId: string;
  storeName: string;
  currency: string;
  expected: number; // Kobo
  actual: number; // Kobo
  variance: number; // Kobo
}

interface ReconciliationData {
  escrowIntegrity: EscrowEntry[];
  ledgerDrift: LedgerEntry[];
  pendingProjections: LedgerEntry[];
  isolation: { currency: string; storeId: string };
  timestamp: string;
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export function ReconciliationWorkbench() {
  const [activeTab, setActiveTab] = useState<'ESCROW' | 'LEDGER'>('ESCROW');
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency] = useState('NGN');

  const fetchReconciliation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/oversight/finance/reconciliation', { params: { currency } });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load the reconciliation report.');
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  const escrowDrift = (data?.escrowIntegrity || []).filter(e => Math.abs(e.variance) > 0);
  const ledgerDrift = data?.ledgerDrift || [];
  const pendingProjections = data?.pendingProjections || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Source of Truth Hierarchy & Warning */}
      <div className="bg-sv-warning-soft border-l-4 border-sv-warning p-4 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="text-sv-warning font-bold">⚠️ Diagnostic View Only</h3>
            <p className="text-sv-warning text-sm mt-1">
              This panel is not authoritative. It cannot be cited in audit reports.
            </p>
            {data?.timestamp && (
              <p className="text-sv-warning text-sm mt-1 font-mono">
                Report generated: {new Date(data.timestamp).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right text-xs text-sv-warning bg-sv-warning-soft p-3 rounded-lg border border-sv-warning/20 shrink-0">
            <p className="font-bold">Source of Truth Hierarchy:</p>
            <ol className="list-decimal list-inside text-left mt-1">
              <li>Ledger (Authoritative)</li>
              <li>Store.availableBalance (Materialized)</li>
              <li className="font-bold">Reconciliation UI (Diagnostic)</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-sv-surface shadow-sm border border-sv-border rounded-2xl overflow-hidden">
        <div className="bg-sv-surface-muted border-b border-sv-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-sv-text-primary">Reconciliation Workbench</h2>
          <div className="flex flex-wrap gap-2">
            <button className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeTab === 'ESCROW' ? 'bg-sv-primary text-sv-text-inverse border-sv-primary' : 'bg-sv-surface text-sv-text-secondary border-sv-border'}`} onClick={() => setActiveTab('ESCROW')}>
              Escrow Integrity {escrowDrift.length > 0 && `(${escrowDrift.length})`}
            </button>
            <button className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeTab === 'LEDGER' ? 'bg-sv-primary text-sv-text-inverse border-sv-primary' : 'bg-sv-surface text-sv-text-secondary border-sv-border'}`} onClick={() => setActiveTab('LEDGER')}>
              Ledger Drift {ledgerDrift.length > 0 && `(${ledgerDrift.length})`}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sv-primary"></div>
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchReconciliation} />
          ) : activeTab === 'ESCROW' ? (
            <div className="space-y-4">
              {escrowDrift.length === 0 ? (
                <div className="p-8 text-center text-sv-text-muted">
                  <span className="inline-block mb-2 text-xs border border-sv-success/30 bg-sv-success-soft text-sv-success px-2.5 py-1 rounded-full font-bold">Healthy</span>
                  <p className="text-sm mt-2">Order totals match escrow held across all {(data?.escrowIntegrity || []).length} stores checked.</p>
                </div>
              ) : escrowDrift.map((entry) => (
                <div key={entry._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 bg-sv-danger-soft border border-sv-danger/30 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-sv-danger">Escrow Drift Detected</h4>
                    <p className="text-sm text-sv-danger font-mono mt-1">Store: {entry._id}</p>
                    <p className="text-xs text-sv-text-secondary font-mono mt-1">
                      Order Total: {naira(entry.totalPricing)} · Escrow Held: {naira(entry.totalEscrow)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sv-danger font-bold">Drift: {entry.variance > 0 ? '+' : ''}{naira(entry.variance)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {ledgerDrift.length === 0 ? (
                <div className="p-8 text-center text-sv-text-muted">
                  <span className="inline-block mb-2 text-xs border border-sv-success/30 bg-sv-success-soft text-sv-success px-2.5 py-1 rounded-full font-bold">Healthy</span>
                  <p className="text-sm mt-2">Store.availableBalance matches the canonical ledger sum for every store checked.</p>
                </div>
              ) : ledgerDrift.map((entry) => (
                <div key={entry.storeId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 bg-sv-danger-soft border border-sv-danger/30 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-sv-danger">Ledger Drift Detected</h4>
                    <p className="text-sm text-sv-danger font-mono mt-1">{entry.storeName}</p>
                    <p className="text-xs text-sv-text-secondary font-mono mt-1">
                      Expected: {naira(entry.expected)} · Actual: {naira(entry.actual)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sv-danger font-bold">Drift: {entry.variance > 0 ? '+' : ''}{naira(entry.variance)}</p>
                  </div>
                </div>
              ))}
              {pendingProjections.length > 0 && (
                <p className="text-xs text-sv-text-muted font-medium pt-2 border-t border-sv-border">
                  {pendingProjections.length} more store{pendingProjections.length === 1 ? '' : 's'} showing expected replication lag (~60s, one cron cycle) — not counted as drift.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReconciliationWorkbench;
