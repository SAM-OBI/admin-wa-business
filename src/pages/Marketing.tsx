import { FiTrendingUp } from 'react-icons/fi';

export default function Marketing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="text-gray-500 mt-1">Manage your campaigns and discount codes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiTrendingUp className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Marketing Hub</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Create and manage discount codes to boost your sales. This feature allows you to run campaigns and track their performance.
        </p>
      </div>
    </div>
  );
}
