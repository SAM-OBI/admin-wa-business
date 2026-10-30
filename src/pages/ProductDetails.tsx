import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, ProductDetails as ProductDetailsType } from '../api/admin.service';
import {
  FiArrowLeft, FiShoppingCart, FiDollarSign, FiStar, FiPackage,
  FiCheckCircle, FiXCircle, FiUser, FiMail, FiPhone
} from 'react-icons/fi';
import { ErrorState } from '../components/ErrorState';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getProductById(id!);
      setProduct(response.data);
    } catch (error: any) {
      console.error('Failed to fetch product details:', error);
      setError(error.response?.data?.message || 'We couldn\'t load this product right now.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id, fetchProductDetails]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState message={error} onRetry={fetchProductDetails} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12 bg-sv-surface border border-sv-border rounded-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-sv-text-primary">Product not found</h2>
          <Link to="/dashboard/products" className="text-sv-primary hover:underline mt-4 inline-block font-medium">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const getStockBadge = () => {
    if (product.stock === 0) return <span className="px-3 py-1 bg-sv-danger-soft text-sv-danger rounded-full text-xs sm:text-sm font-semibold">Out of Stock</span>;
    if (product.stock <= 20) return <span className="px-3 py-1 bg-sv-warning-soft text-sv-warning rounded-full text-xs sm:text-sm font-semibold">Low Stock ({product.stock})</span>;
    return <span className="px-3 py-1 bg-sv-success-soft text-sv-success rounded-full text-xs sm:text-sm font-semibold">In Stock ({product.stock})</span>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/dashboard/products"
          className="inline-flex items-center text-sv-primary hover:text-sv-primary-hover text-sm font-medium transition-colors mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Products
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">{product.name}</h1>
            <p className="text-sv-text-secondary text-sm sm:text-base mt-1">
              {typeof product.category === 'object' && product.category !== null 
                ? product.category.name 
                : product.category}
            </p>
          </div>
          
          <div className="self-start sm:self-auto">
            {getStockBadge()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-sv-text-secondary">Total Sold</p>
              <p className="text-xl sm:text-2xl font-black text-sv-text-primary mt-1">{product.salesStats?.totalSold || 0}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-sv-info-soft rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-sv-info" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-sv-text-secondary">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-black text-sv-text-primary mt-1">
                ₦{(product.salesStats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-sv-success-soft rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-sv-success" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-sv-text-secondary">Average Rating</p>
              <p className="text-xl sm:text-2xl font-black text-sv-text-primary mt-1">{product.averageRating.toFixed(1)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-sv-warning-soft rounded-lg flex items-center justify-center">
              <FiStar className="text-sv-warning" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-sv-text-secondary">Current Stock</p>
              <p className="text-xl sm:text-2xl font-black text-sv-text-primary mt-1">{product.stock}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-sv-surface-muted rounded-lg flex items-center justify-center">
              <FiPackage className="text-sv-primary" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-sv-text-primary mb-4">Product Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-40 sm:h-48 object-cover rounded-lg border border-sv-border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-sv-text-primary mb-4">Product Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Price</span>
                <span className="font-bold text-sv-text-primary">₦{product.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Category</span>
                <span className="text-sm font-medium text-sv-text-primary">
                  {typeof product.category === 'object' && product.category !== null 
                    ? product.category.name 
                    : product.category}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  product.status === 'active' ? 'bg-sv-success-soft text-sv-success' : 'bg-sv-surface-muted text-sv-text-secondary'
                }`}>
                  {product.status === 'active' ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
                  {product.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Listed Date</span>
                <span className="text-sm text-sv-text-primary">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {product.longDescription && (
              <div className="mt-4 pt-4 border-t border-sv-border">
                <h3 className="font-semibold text-sv-text-primary mb-2 text-sm sm:text-base">Description</h3>
                <p className="text-sm sm:text-base text-sv-text-secondary leading-relaxed">{product.longDescription}</p>
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-sv-text-primary mb-4">Customer Reviews ({product.reviewCount})</h2>
              <div className="space-y-3">
                {product.reviews.map((review: any) => (
                  <div key={review._id} className="p-3.5 border border-sv-border bg-sv-surface-muted/40 rounded-lg sm:rounded-xl">
                    <div className="flex items-start gap-3">
                      <FiStar className="text-sv-warning mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <p className="font-semibold text-sv-text-primary text-sm truncate">{review.user?.name || 'Customer'}</p>
                          <span className="text-xs sm:text-sm font-semibold text-sv-warning shrink-0">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-sv-text-secondary mt-1">{review.comment}</p>
                        <p className="text-xs text-sv-text-muted mt-1.5">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Vendor Information */}
          {product.vendor && (
            <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-sv-text-primary mb-4">Vendor Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiUser className="text-sv-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-sv-text-muted">Vendor Name</p>
                    <Link 
                      to={`/dashboard/vendors/${product.vendor._id}`}
                      className="font-medium text-sm text-sv-primary hover:text-sv-primary-hover truncate block transition-colors"
                    >
                      {product.vendor.name}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiMail className="text-sv-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-sv-text-muted">Email</p>
                    <p className="font-medium text-sm text-sv-text-primary truncate">{product.vendor.email}</p>
                  </div>
                </div>
                {product.vendor.phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-sv-text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-sv-text-muted">Phone</p>
                      <p className="font-medium text-sm text-sv-text-primary">{product.vendor.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sales Analytics */}
          <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-sv-text-primary mb-4">Sales Analytics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Units Sold</span>
                <span className="font-bold text-sv-text-primary">{product.salesStats?.totalSold || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Total Revenue</span>
                <span className="font-bold text-sv-text-primary">
                  ₦{(product.salesStats?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Reviews</span>
                <span className="font-bold text-sv-text-primary">{product.reviewCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Avg. Rating</span>
                <span className="font-bold text-sv-warning">{product.averageRating.toFixed(1)}/5</span>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="bg-sv-surface p-4 sm:p-6 rounded-xl border border-sv-border shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-sv-text-primary mb-4">Inventory Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Current Stock</span>
                {getStockBadge()}
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-sv-text-secondary">Total Sold</span>
                <span className="font-bold text-sv-text-primary">{product.soldCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
