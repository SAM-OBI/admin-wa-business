import { useEffect, useState, useCallback } from 'react';
import { adminService, Product } from '../api/admin.service';
import { FiPackage, FiEye, FiEyeOff } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import { Link } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setError(error.response?.data?.message || 'We couldn\'t load products right now.');
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight uppercase">Global Catalog</h1>
          <p className="text-sv-text-muted font-medium mt-1 uppercase text-xs tracking-[0.2em]">SKU Inventory & Moderation Protocol</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full sm:w-auto px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
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

      <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface-muted/50">
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">SKU Metadata</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Origin Source</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Pricing Index</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Velocity Index</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Reserves</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">State</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-sv-surface-muted/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-sv-border group-hover:border-sv-primary/40 transition-all shadow-inner"
                        />
                      ) : (
                        <div className="bg-sv-surface-muted w-14 h-14 rounded-xl flex items-center justify-center text-sv-text-muted border border-sv-border">
                          <FiPackage size={20} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                            <div className="font-black text-sv-text-primary text-sm tracking-tight">{product.name}</div>
                            {(product as any).soldCount > 50 && (
                                <span className="bg-sv-success-soft text-sv-success text-[7px] font-black uppercase px-2 py-0.5 rounded border border-sv-success/30">Elite Asset</span>
                            )}
                        </div>
                        <div className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest mt-1">
                          {typeof product.category === 'object' && product.category !== null 
                            ? product.category.name 
                            : product.category || 'UNCLASSIFIED'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sv-text-secondary font-bold text-xs uppercase tracking-tighter">
                    {product.storeName || 'DIRECT_LINK'}
                  </td>
                  <td className="px-6 py-4 font-black text-sv-text-primary text-sm">
                    ₦{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-sv-text-primary">{(product as any).soldCount || 0} Sold</span>
                        <span className="text-[9px] text-sv-text-muted font-bold uppercase tracking-widest">Market Demand</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-sv-success' : 'bg-sv-text-muted'}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                         product.status === 'active' ? 'text-sv-success' : 'text-sv-text-muted'
                       }`}>
                         {product.status.toUpperCase()}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/dashboard/products/${product._id}`}
                        className="text-[10px] font-black uppercase text-sv-text-primary hover:text-sv-primary transition-colors border border-sv-border px-3 py-1.5 rounded-lg bg-sv-surface-muted"
                      >
                        Deep Dive
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`text-[10px] font-black uppercase p-2 rounded-lg transition-all border ${
                          product.status === 'active' 
                            ? 'text-sv-text-muted border-sv-border hover:bg-sv-surface-muted' 
                            : 'text-sv-success border-sv-success/30 hover:bg-sv-success-soft'
                        }`}
                        title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {product.status === 'active' ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {error && (
                <tr>
                  <td colSpan={7} className="px-6 py-16">
                    <ErrorState message={error} onRetry={() => fetchProducts(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiPackage className="text-sv-text-muted w-12 h-12" />
                      <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.3em] italic">No active SKUs detected in registry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Global Pagination Hub */}
        <div className="px-6 py-4 border-t border-sv-border bg-sv-surface-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">{filteredProducts.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> SKUs
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
