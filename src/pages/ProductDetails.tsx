import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, ProductDetails as ProductDetailsType } from '../api/admin.service';
import { 
  FiArrowLeft, FiShoppingCart, FiDollarSign, FiStar, FiPackage,
  FiCheckCircle, FiXCircle, FiUser, FiMail, FiPhone
} from 'react-icons/fi';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProductDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getProductById(id!);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
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
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
          <Link to="/products" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const getStockBadge = () => {
    if (product.stock === 0) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Out of Stock</span>;
    if (product.stock <= 20) return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Low Stock ({product.stock})</span>;
    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">In Stock ({product.stock})</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/products" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Products
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-gray-500 mt-1">
              {typeof product.category === 'object' && product.category !== null 
                ? product.category.name 
                : product.category}
            </p>
          </div>
          
          <div>
            {getStockBadge()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sold</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{product.salesStats?.totalSold || 0}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₦{(product.salesStats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{product.averageRating.toFixed(1)}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiStar className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{product.stock}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Product Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Product Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-gray-800">₦{product.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="text-gray-800">
              {typeof product.category === 'object' && product.category !== null 
                ? product.category.name 
                : product.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status === 'active' ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
                  {product.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Listed Date</span>
                <span className="text-gray-800">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {product.longDescription && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-700">{product.longDescription}</p>
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Reviews ({product.reviewCount})</h2>
              <div className="space-y-3">
                {product.reviews.map((review: any) => (
                  <div key={review._id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiStar className="text-yellow-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800">{review.user.name}</p>
                          <span className="text-sm font-semibold text-yellow-600">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Vendor Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Vendor Name</p>
                    <Link 
                      to={`/vendors/${product.vendor._id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {product.vendor.name}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{product.vendor.email}</p>
                  </div>
                </div>
                {product.vendor.phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{product.vendor.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sales Analytics */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Sales Analytics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Units Sold</span>
                <span className="font-bold text-gray-800">{product.salesStats?.totalSold || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold text-gray-800">
                  ₦{(product.salesStats?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reviews</span>
                <span className="font-bold text-gray-800">{product.reviewCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Rating</span>
                <span className="font-bold text-yellow-600">{product.averageRating.toFixed(1)}/5</span>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Inventory Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Stock</span>
                {getStockBadge()}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sold</span>
                <span className="font-bold text-gray-800">{product.soldCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
