import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { FiPackage, FiSlash, FiFlag, FiSearch, FiHome } from 'react-icons/fi';
import Swal from 'sweetalert2';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  status?: string;
  images?: string[];
  store: {
    _id: string;
    name: string;
    slug: string;
  };
  category?: {
    name: string;
  };
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ProductModeration() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    store: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    disabled: 0,
    flagged: 0
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.store) params.store = filters.store;

      const res = await api.get('/admin/products', { params });

      if (res.data.success) {
        setProducts(res.data.data.products);
        setPagination(res.data.data.pagination);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/products/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const handleDisableProduct = async (productId: string, productName: string) => {
    const { value: formValues } = await Swal.fire({
      title: 'Disable Product',
      html: `
        <div class="text-left">
          <p class="mb-4 text-sm text-gray-500">You are about to disable: <strong>${productName}</strong></p>
          <select id="reason" class="swal2-input w-full mb-2">
            <option value="">Select Reason</option>
            <option value="Prohibited item">Prohibited item</option>
            <option value="Trademark violation">Trademark violation</option>
            <option value="Inappropriate content">Inappropriate content</option>
            <option value="Fraudulent listing">Fraudulent listing</option>
            <option value="Other">Other</option>
          </select>
          <textarea id="custom-reason" class="swal2-textarea w-full" placeholder="Additional notes..." rows="3"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Disable Product',
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLSelectElement)?.value;
        const customReason = (document.getElementById('custom-reason') as HTMLTextAreaElement)?.value;
        
        if (!reason) {
          Swal.showValidationMessage('Please select a reason');
          return false;
        }
        
        return { reason: customReason || reason };
      }
    });

    if (formValues) {
      try {
        const res = await api.patch(`/admin/products/${productId}/disable`, {
          reason: formValues.reason,
          notifyVendor: true
        });

        if (res.data.success) {
          Swal.fire('Disabled!', 'Product has been disabled and vendor notified', 'success');
          fetchProducts();
          fetchStats();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to disable product', 'error');
      }
    }
  };

  const handleEnableProduct = async (productId: string) => {
    const result = await Swal.fire({
      title: 'Enable Product?',
      text: 'This will restore the product to active status',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, enable'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.patch(`/admin/products/${productId}/enable`);
        
        if (res.data.success) {
          Swal.fire('Enabled!', 'Product has been restored', 'success');
          fetchProducts();
          fetchStats();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to enable product', 'error');
      }
    }
  };

  const handleFlagProduct = async (productId: string, productName: string) => {
    const { value: formValues } = await Swal.fire({
      title: 'Flag for Review',
      html: `
        <div class="text-left">
          <p class="mb-4 text-sm text-gray-500">Flag: <strong>${productName}</strong></p>
          <select id="severity" class="swal2-input w-full mb-2">
            <option value="low">Low Priority</option>
            <option value="medium" selected>Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <textarea id="reason" class="swal2-textarea w-full" placeholder="Reason for flagging..." rows="3" required></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Flag Product',
      preConfirm: () => {
        const severity = (document.getElementById('severity') as HTMLSelectElement)?.value;
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value;
        
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason');
          return false;
        }
        
        return { severity, reason };
      }
    });

    if (formValues) {
      try {
        const res = await api.patch(`/admin/products/${productId}/flag`, formValues);
        
        if (res.data.success) {
          Swal.fire('Flagged!', 'Product flagged for review', 'success');
          fetchProducts();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to flag product', 'error');
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status });
    setPagination({ ...pagination, page: 1 });
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
                <FiPackage size={24} />
            </div>
            Product Moderation
          </h1>
          <p className="text-gray-500 text-sm mt-1">Platform-wide product oversight and lifecycle management</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            {['all', 'active', 'disabled'].map(s => (
                <button
                    key={s}
                    onClick={() => handleStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        filters.status === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    {s}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
            { label: 'Total Inventory', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Market Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50/30' },
            { label: 'Policy Blocked', value: stats.disabled, color: 'text-red-600', bg: 'bg-red-50/30' },
            { label: 'Under Review', value: stats.flagged, color: 'text-amber-600', bg: 'bg-amber-50/30' }
        ].map(card => (
            <div key={card.label} className={`${card.bg} border border-gray-100 rounded-2xl p-6 shadow-sm`}>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</div>
                <div className={`text-2xl font-black ${card.color}`}>{card.value.toLocaleString()}</div>
            </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by product name, vendor, or SKU..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium transition-all"
            />
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Storefront</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">In Stock</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><FiPackage /></div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-800">{product.name}</div>
                        <div className="text-[10px] font-black text-blue-600 uppercase mt-0.5">{product.category?.name || 'Uncategorized'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FiHome className="text-gray-300" size={12} />
                      <span className="text-xs font-bold text-gray-600">{product.store.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-black ${product.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>{product.stock}</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.status === 'disabled' || !product.isActive ? (
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-100">Blocked</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-green-50 text-green-600 border border-green-100">Live</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => handleFlagProduct(product._id, product.name)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                            title="Flag for Manual Review"
                        >
                            <FiFlag size={14} />
                        </button>
                        {product.status === 'disabled' || !product.isActive ? (
                            <button
                                onClick={() => handleEnableProduct(product._id)}
                                className="px-4 py-1.5 text-[9px] font-black uppercase bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100"
                            >
                                Restore
                            </button>
                        ) : (
                            <button
                                onClick={() => handleDisableProduct(product._id, product.name)}
                                className="px-4 py-1.5 text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1.5"
                            >
                                <FiSlash size={10} /> Deactivate
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <div className="text-[10px] font-black text-gray-400 uppercase">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-1.5 text-[9px] font-black uppercase bg-gray-50 text-gray-600 rounded-lg border border-gray-100 disabled:opacity-50"
                >
                    Prev
                </button>
                <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-1.5 text-[9px] font-black uppercase bg-gray-50 text-gray-600 rounded-lg border border-gray-100 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
