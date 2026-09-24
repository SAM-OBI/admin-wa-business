import { useEffect, useState, useCallback } from 'react';
import { adminService, Product } from '../api/admin.service';
import { FiPackage, FiEye, FiEyeOff } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import { Link } from 'react-router-dom';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const [filters, setFilters] = useState({
    status: ''
  });

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      console.log('Fetching products with filters:', { search: searchTerm, status: filters.status, page, limit: pagination.limit });
      const data = await adminService.getProducts<any>({
        search: searchTerm,
        status: filters.status,
        page,
        limit: pagination.limit
      });
      
      console.log('Products API response:', data);

      if (data.data?.products) {
         console.log('Products found:', data.data.products.length);
         setProducts(data.data.products);
         setPagination(data.data.pagination);
      } else if (Array.isArray(data.data)) {
         console.log('Products array found directly:', data.data.length);
         setProducts(data.data);
      } else {
         console.warn('Unexpected products data structure:', data);
         setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters.status, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchProducts(newPage);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await adminService.toggleProductStatus(product._id, product.status);
      // Refresh to respect current filters
      fetchProducts(pagination.page);
    } catch (error) {
      console.error('Failed to update product status:', error);
    }
  };

  // Removed client-side filtering
  const filteredProducts = products;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Global Catalog</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">SKU Inventory & Moderation Protocol</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 bg-sv-surface-elevated/50 border border-sv-border text-sv-text-muted text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <HardenedSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="SEARCH SKUS..."
            className="w-full sm:w-72"
            context="ADMIN"
          />
        </div>
      </div>

      <div className="bg-sv-surface-elevated/50 rounded-2xl border border-sv-border backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface/5">
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">SKU Metadata</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Origin Source</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Pricing Index</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Velocity Index</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Reserves</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">State</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-sv-surface-muted transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-white/5 group-hover:border-white/20 transition-all shadow-inner"
                        />
                      ) : (
                        <div className="bg-zinc-800 w-14 h-14 rounded-xl flex items-center justify-center text-zinc-500 border border-white/5">
                          <FiPackage size={20} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                            <div className="font-black text-white text-sm tracking-tight">{product.name}</div>
                            {(product as any).soldCount > 50 && (
                                <span className="bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">Elite Asset</span>
                            )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          {typeof product.category === 'object' && product.category !== null 
                            ? product.category.name 
                            : product.category || 'UNCLASSIFIED'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sv-text-secondary font-bold text-xs uppercase tracking-tighter">
                    {product.storeName || 'DIRECT_LINK'}
                  </td>
                  <td className="px-8 py-6 font-black text-sv-text-primary text-sm">
                    ₦{product.price.toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-sv-text-primary">{(product as any).soldCount || 0} Sold</span>
                        <span className="text-[9px] text-sv-text-muted font-bold uppercase tracking-widest">Market Demand</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                      product.stock === 0 ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30' :
                      product.stock <= 20 ? 'bg-sv-warning-soft text-sv-warning border-sv-warning/30' :
                      'bg-sv-success-soft text-sv-success border-sv-success/30'
                    }`}>
                      {product.stock === 0 ? 'DEPLETED' :
                       product.stock <= 20 ? `LOW_STOCK (${product.stock})` :
                       `${product.stock} UNITS`}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                         product.status === 'active' ? 'text-emerald-500' : 'text-zinc-500'
                       }`}>
                         {product.status.toUpperCase()}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/dashboard/products/${product._id}`}
                        className="text-[10px] font-black uppercase text-white hover:text-zinc-300 transition-colors border border-white/5 px-3 py-1.5 rounded-lg bg-white/[0.03]"
                      >
                        Deep Dive
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`text-[10px] font-black uppercase p-2 rounded-lg transition-all border ${
                          product.status === 'active' 
                            ? 'text-zinc-500 border-white/5 hover:bg-white/5' 
                            : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                        title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {product.status === 'active' ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiPackage className="text-zinc-800 w-12 h-12" />
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No active SKUs detected in registry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Global Pagination Hub */}
        <div className="px-8 py-6 border-t border-sv-border bg-sv-surface/5 flex items-center justify-between">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">{filteredProducts.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> SKUs
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
