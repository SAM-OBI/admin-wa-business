import { useEffect, useState, useCallback, useRef } from 'react';
import { FiTruck, FiPlus, FiTrash2, FiEdit2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { logger } from '../utils/logger';

/**
 * 🛡️ [LOGISTICS-SHIPMENT-SHELL-1] Real provider-account config CRUD.
 * isImplemented (computed server-side from the actual code registry, never
 * stored) is shown plainly — a config can exist here before a real
 * integration is built, and this page never pretends otherwise. No
 * quote()/createShipment() call happens from this page; it only ever
 * writes config data.
 */

interface ProviderConfig {
  _id: string;
  name: string;
  providerCode: string;
  isActive: boolean;
  serviceAreaStates: string[];
  hasApiKey: boolean;
  isImplemented: boolean;
  pricingRule?: { type: 'FLAT' | 'PER_KG'; baseFeeKobo?: number; perKgFeeKobo?: number };
}

const EMPTY_FORM = { name: '', providerCode: '', serviceAreaStates: '', apiKey: '', pricingType: 'FLAT' as 'FLAT' | 'PER_KG', baseFeeKobo: '', perKgFeeKobo: '' };

function LogisticsProvidersInner() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [implementedCodes, setImplementedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // 🛡️ Same step-up modal, shared across create/update/delete — all three
  // gate on the same backend sensitive-action name. pendingSubmitPayload
  // (a ref, not state — it never needs to trigger a re-render) carries the
  // create/update payload across the async gap while the modal is open;
  // deletingId plays the same role for delete. isOpen alone is enough
  // state to drive the modal itself.
  const [challengeOpen, setChallengeOpen] = useState(false);
  const pendingSubmitPayload = useRef<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminService.getLogisticsProviders();
      setConfigs(res.data?.configs || []);
      setImplementedCodes(res.data?.implementedCodes || []);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message || 'Could not load logistics providers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const startEdit = (config: ProviderConfig) => {
    setEditingId(config._id);
    setForm({
      name: config.name,
      providerCode: config.providerCode,
      serviceAreaStates: config.serviceAreaStates.join(', '),
      apiKey: '',
      pricingType: config.pricingRule?.type || 'FLAT',
      baseFeeKobo: config.pricingRule?.baseFeeKobo !== undefined ? String(config.pricingRule.baseFeeKobo / 100) : '',
      perKgFeeKobo: config.pricingRule?.perKgFeeKobo !== undefined ? String(config.pricingRule.perKgFeeKobo / 100) : ''
    });
    setFormError(null);
    setShowForm(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) { setFormError('A name is required.'); return; }
    if (!form.providerCode.trim()) { setFormError('A provider code is required.'); return; }
    setFormError(null);

    const payload: any = {
      name: form.name.trim(),
      providerCode: form.providerCode.trim(),
      serviceAreaStates: form.serviceAreaStates.split(',').map((s) => s.trim()).filter(Boolean),
      pricingRule: {
        type: form.pricingType,
        baseFeeKobo: form.baseFeeKobo ? Math.round(Number(form.baseFeeKobo) * 100) : undefined,
        perKgFeeKobo: form.perKgFeeKobo ? Math.round(Number(form.perKgFeeKobo) * 100) : undefined
      }
    };
    if (form.apiKey) payload.apiKey = form.apiKey;

    pendingSubmitPayload.current = payload;
    setChallengeOpen(true);
  };

  const handleChallengeSuccess = async (challengeToken: string) => {
    // Delete takes priority when both happen to be set — requestDelete
    // always clears pendingSubmitPayload first, so this never ambiguously
    // fires both for the same confirmation.
    if (deletingId) {
      try {
        await adminService.deleteLogisticsProvider(deletingId, challengeToken);
        await fetchConfigs();
      } catch (err: any) {
        logger.error('Failed to delete provider:', err);
      } finally {
        setDeletingId(null);
        setChallengeOpen(false);
      }
      return;
    }

    const payload = pendingSubmitPayload.current;
    try {
      if (editingId) {
        await adminService.updateLogisticsProvider(editingId, payload, challengeToken);
      } else {
        await adminService.createLogisticsProvider(payload, challengeToken);
      }
      setShowForm(false);
      await fetchConfigs();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Could not save this provider.');
    } finally {
      pendingSubmitPayload.current = null;
      setChallengeOpen(false);
    }
  };

  const requestDelete = (configId: string) => {
    pendingSubmitPayload.current = null;
    setDeletingId(configId);
    setChallengeOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 rounded-2xl bg-sv-danger-soft border border-sv-danger/30 flex flex-col items-center text-center gap-3">
        <FiAlertCircle className="text-sv-danger text-2xl" />
        <p className="text-xs text-sv-danger font-bold uppercase tracking-tight">{loadError}</p>
        <button onClick={fetchConfigs} className="text-xs font-black uppercase tracking-widest text-sv-danger underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight uppercase">Logistics Providers</h1>
          <p className="text-sv-text-muted font-medium mt-1 uppercase text-xs tracking-[0.2em]">
            Courier accounts &amp; pricing — "Connected" means a real integration exists for this code today
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-sv-primary text-sv-text-inverse text-xs font-black uppercase tracking-widest rounded-xl hover:bg-sv-primary-hover transition-all"
        >
          <FiPlus /> Add Provider
        </button>
      </div>

      {showForm && (
        <div className="bg-sv-surface rounded-2xl border border-sv-border p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-black text-sv-text-primary uppercase tracking-widest">{editingId ? 'Edit Provider' : 'New Provider'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. GIG Logistics — Lagos"
              className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:outline-none focus:border-sv-primary transition-all"
            />
            <div>
              <input
                value={form.providerCode}
                onChange={(e) => setForm((f) => ({ ...f, providerCode: e.target.value.toUpperCase() }))}
                placeholder="Provider code, e.g. GIG"
                className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:outline-none focus:border-sv-primary transition-all w-full"
              />
              <p className="text-[10px] text-sv-text-muted mt-1">
                Connected codes today: {implementedCodes.join(', ') || 'none'} — any other code saves as config only, not yet callable.
              </p>
            </div>
            <input
              value={form.serviceAreaStates}
              onChange={(e) => setForm((f) => ({ ...f, serviceAreaStates: e.target.value }))}
              placeholder="Service area states, comma-separated (blank = nationwide)"
              className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:outline-none focus:border-sv-primary transition-all sm:col-span-2"
            />
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={editingId ? 'Leave blank to keep current API key' : 'API key (optional — stored encrypted)'}
              className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:outline-none focus:border-sv-primary transition-all sm:col-span-2"
            />
            <select
              value={form.pricingType}
              onChange={(e) => setForm((f) => ({ ...f, pricingType: e.target.value as 'FLAT' | 'PER_KG' }))}
              className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary focus:outline-none focus:border-sv-primary transition-all"
            >
              <option value="FLAT">Flat fee</option>
              <option value="PER_KG">Per kg</option>
            </select>
            {form.pricingType === 'FLAT' ? (
              <input
                type="number" min={0} value={form.baseFeeKobo}
                onChange={(e) => setForm((f) => ({ ...f, baseFeeKobo: e.target.value }))}
                placeholder="Base fee (₦)"
                className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:outline-none focus:border-sv-primary transition-all"
              />
            ) : (
              <input
                type="number" min={0} value={form.perKgFeeKobo}
                onChange={(e) => setForm((f) => ({ ...f, perKgFeeKobo: e.target.value }))}
                placeholder="Fee per kg (₦)"
                className="h-11 px-4 rounded-xl border border-sv-border bg-sv-surface-muted text-sm text-sv-text-primary placeholder:text-sv-text-muted focus:outline-none focus:border-sv-primary transition-all"
              />
            )}
          </div>
          {formError && <p className="text-xs text-sv-danger font-bold">{formError}</p>}
          <div className="flex gap-3">
            <button onClick={submitForm} className="px-5 py-2.5 bg-sv-primary text-sv-text-inverse text-xs font-black uppercase tracking-widest rounded-xl hover:bg-sv-primary-hover transition-all">
              {editingId ? 'Save Changes' : 'Create Provider'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-sv-text-muted hover:text-sv-text-primary transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface-muted/50">
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Provider</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Coverage</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Connection</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Active</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {configs.map((config) => (
                <tr key={config._id} className="hover:bg-sv-surface-muted/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sv-surface-muted rounded-lg text-sv-text-muted border border-sv-border group-hover:text-sv-text-primary transition-colors">
                        <FiTruck size={14} />
                      </div>
                      <span className="font-black text-sv-text-primary text-sm">{config.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-sv-text-muted">{config.providerCode}</td>
                  <td className="px-6 py-4 text-xs text-sv-text-muted">{config.serviceAreaStates.length ? config.serviceAreaStates.join(', ') : 'Nationwide'}</td>
                  <td className="px-6 py-4">
                    {config.isImplemented ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sv-success"><FiCheckCircle /> Connected</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sv-text-muted"><FiAlertCircle /> Not Implemented</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold">{config.isActive ? <span className="text-sv-success">Yes</span> : <span className="text-sv-text-muted">No</span>}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => startEdit(config)} className="text-sv-text-muted hover:text-sv-text-primary transition-colors"><FiEdit2 size={14} /></button>
                      <button onClick={() => requestDelete(config._id)} className="text-sv-text-muted hover:text-sv-danger transition-colors"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {configs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-sv-text-muted uppercase tracking-widest">No providers configured yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminSecurityChallengeModal
        isOpen={challengeOpen}
        onClose={() => { setChallengeOpen(false); setDeletingId(null); pendingSubmitPayload.current = null; }}
        action="MANAGE_LOGISTICS_PROVIDER"
        onSuccess={handleChallengeSuccess}
      />
    </div>
  );
}

export default function LogisticsProviders() {
  return (
    <ErrorBoundary name="Logistics Providers">
      <LogisticsProvidersInner />
    </ErrorBoundary>
  );
}
