import { useEffect, useState } from 'react';
import { Vendor } from '../api/admin.service';
import { FiShield, FiAlertTriangle } from 'react-icons/fi';
import api from '../api/axios';

interface HighRiskVendor extends Vendor {
  riskFactors: string[];
  riskScore: number;
  ownerName: string;
}

export default function RiskManagement() {
  const [vendors, setVendors] = useState<HighRiskVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // 'critical' | 'high'

  useEffect(() => {
    fetchHighRiskVendors();
  }, []);

  const fetchHighRiskVendors = async () => {
    try {
      const response = await api.get('/admin/risk/high-risk-vendors');
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch high risk vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (id: string) => {
    try {
      await api.patch(`/admin/risk/vendors/${id}/recalculate`);
      fetchHighRiskVendors();
    } catch (error) {
      console.error('Failed to recalculate risk:', error);
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
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Risk Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor high-risk accounts and anomalies</p>
        </div>

        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Risks</option>
            <option value="critical">Critical Only (80+)</option>
            <option value="high">High Only (50-79)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-red-50 border border-red-100 p-6 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiAlertTriangle className="text-red-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">High Risk Objects</h3>
              <p className="text-gray-600 mt-1">
                {vendors.length} vendors have been flagged with high risk scores requiring attention.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Flagged Vendors</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor._id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{vendor.storeName}</div>
                    <div className="text-sm text-gray-500">{vendor.ownerName}</div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-red-600 font-bold">
                       <FiShield />
                       {vendor.riskScore}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                      High Risk
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRecalculate(vendor._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Recalculate Score
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No high risk vendors matches filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
