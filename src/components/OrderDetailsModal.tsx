import { FiX, FiPackage, FiCalendar, FiDollarSign, FiMapPin, FiUser } from 'react-icons/fi';
import { Order } from '../api/admin.service';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-500 mt-1">Order #{order._id.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Order Status</p>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Payment Status</p>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                order.paymentInfo?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.paymentInfo?.status || 'Pending'}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiUser className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Customer Information</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700"><span className="font-medium">Name:</span> {order.user.name}</p>
              <p className="text-gray-700"><span className="font-medium">Email:</span> {order.user.email}</p>
              <p className="text-gray-700"><span className="font-medium">Phone:</span> {order.user.phone}</p>
            </div>
          </div>

          {/* Store Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Store</h3>
            <p className="text-gray-700">{'name' in order.store ? order.store.name : order.store.storeName}</p>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiMapPin className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Shipping Address</h3>
              </div>
              <p className="text-gray-700">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} 
                {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
              </p>
            </div>
          )}

          {/* Order Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiPackage className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Order Items</h3>
            </div>
            <div className="space-y-3">
              {order.products.map((item, index) => (
                <div key={index} className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4">
                  {item.product.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiDollarSign className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-300">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiCalendar className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Order Timeline</h3>
              </div>
              <div className="space-y-3">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Date */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            Order placed on {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
