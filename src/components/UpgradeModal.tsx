import { FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50 rounded-full -ml-12 -mb-12 opacity-50" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <FiLock className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unlock Marketing Hub
          </h2>
          
          <p className="text-gray-600 mb-8 max-w-sm">
            Upgrade to a Pro plan to access advanced marketing tools, create discount codes, and boost your sales.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleUpgrade}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Upgrade Now
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 px-4 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
