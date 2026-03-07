import { useEffect, useState, useCallback } from 'react';
import { adminService, Product } from '../api/admin.service';
import { FiSearch, FiPackage, FiEye, FiEyeOff } from 'react-icons/fi';
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
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-white/20 transition-all cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="SEARCH SKUS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-2 bg-zinc-900/50 border border-zinc-800/40 text-white text-xs font-bold placeholder:text-zinc-700 rounded-xl focus:outline-none focus:border-white/20 w-full sm:w-72 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/40 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">SKU Metadata</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Origin Source</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Pricing Index</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Reserves</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">State</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-white/[0.03] transition-colors group">
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
                        <div className="font-black text-white text-sm tracking-tight">{product.name}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          {typeof product.category === 'object' && product.category !== null 
                            ? product.category.name 
                            : product.category || 'UNCLASSIFIED'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-zinc-400 font-bold text-xs uppercase tracking-tighter">
                    {product.storeName || 'DIRECT_LINK'}
                  </td>
                  <td className="px-8 py-6 font-black text-white text-sm">
                    ₦{product.price.toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                      product.stock === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                      product.stock <= 20 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
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
        <div className="px-8 py-6 border-t border-zinc-800/60 bg-white/[0.01] flex items-center justify-between">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Registry Index <span className="text-white mx-1">{filteredProducts.length}</span> of <span className="text-white mx-1">{pagination.total}</span> SKUs
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-zinc-800/60 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.05] transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-md border border-white/5">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-zinc-800/60 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.05] transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
