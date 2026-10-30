import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vendor } from '../api/admin.service';
import { FiShield, FiAlertTriangle } from 'react-icons/fi';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';

interface HighRiskVendor extends Vendor {
  riskFactors: string[];
  riskScore: number;
  ownerName: string;
}

export default function RiskManagement() {
  const [vendors, setVendors] = useState<HighRiskVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(''); // 'critical' | 'high'
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHighRiskVendors();
  }, []);

  const fetchHighRiskVendors = async () => {
    setError(null);
    try {
      const response = await api.get('/admin/risk/high-risk-vendors');
      setVendors(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch high risk vendors:', error);
      setError(error.response?.data?.message || 'We couldn\'t load high-risk vendors right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (id: string) => {
    if (recalculatingId) return;
    setRecalculatingId(id);
    try {
      await api.patch(`/admin/risk/vendors/${id}/recalculate`);
      fetchHighRiskVendors();
    } catch (error: any) {
      console.error('Failed to recalculate risk:', error);
      alert(error.response?.data?.message || 'Failed to recalculate risk score.');
    } finally {
      setRecalculatingId(null);
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (!filter) return true;
    if (filter === 'critical') return v.riskScore >= 80;
    if (filter === 'high') return v.riskScore >= 50 && v.riskScore < 80;
    return true;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Risk Management</h1>
          <p className="text-sv-text-muted text-sm mt-1 flex flex-wrap items-center gap-2">
            <span>Monitor high-risk accounts and anomalies</span>
            <span className="hidden sm:inline text-sv-border">|</span>
            <Link to="/dashboard/security" className="text-sv-primary hover:underline flex items-center gap-1 font-bold">
              <FiShield /> Open Security SOC
            </Link>
          </p>
        </div>

        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface text-sv-text-primary text-sm shadow-xs"
          >
            <option value="">All Risks</option>
            <option value="critical">Critical Only (80+)</option>
            <option value="high">High Only (50-79)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sv-danger-soft/30 border border-sv-danger/20 p-4 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-sv-danger-soft text-sv-danger rounded-xl border border-sv-danger/20 shrink-0">
              <FiAlertTriangle className="text-xl" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-sv-text-primary">High Risk Objects</h3>
              <p className="text-sv-text-secondary text-sm mt-1 leading-relaxed">
                {vendors.length} vendors have been flagged with high risk scores requiring attention.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-sv-text-primary tracking-tight">Flagged Vendors</h2>
        <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-sv-surface-muted border-b border-sv-border">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-border">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-sv-surface-muted transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sv-text-primary">{vendor.storeName}</div>
                      <div className="text-xs text-sv-text-muted mt-0.5">{vendor.ownerName}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-sv-danger font-bold text-sm">
                         <FiShield />
                         {vendor.riskScore}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full bg-sv-danger-soft text-sv-danger border border-sv-danger/20">
                        High Risk
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRecalculate(vendor._id)}
                        disabled={recalculatingId === vendor._id}
                        className="text-sv-primary hover:text-sv-primary-hover text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {recalculatingId === vendor._id ? 'Recalculating...' : 'Recalculate Score'}
                      </button>
                    </td>
                  </tr>
                ))}

                {error && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12">
                      <ErrorState message={error} onRetry={fetchHighRiskVendors} />
                    </td>
                  </tr>
                )}

                {!error && filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sv-text-secondary">
                      No high risk vendors matches filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
