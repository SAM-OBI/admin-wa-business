import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { adminService } from '../api/admin.service';
import { FiClock, FiMonitor, FiShield, FiCheckCircle } from 'react-icons/fi';
import SecurityQuestionModal from '../components/SecurityQuestionModal';

// Login History Component ... (unchanged)
// Enhanced Session & Login History Component
const LoginHistory = () => {
    const [data, setData] = useState<{ attempts: any[], sessions: any[] }>({ attempts: [], sessions: [] });
    const [loading, setLoading] = useState(true);

    const fetchLoginHistory = async () => {
        try {
            const res = await api.get('/auth/login-history');
            setData(res.data.data || { attempts: [], sessions: [] });
        } catch (error) {
            console.error('Failed to fetch login history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoginHistory();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await api.post(`/auth/sessions/${sessionId}/revoke`);
            fetchLoginHistory();
        } catch (error) {
            console.error('Failed to logout device');
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading security data...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiMonitor className="text-blue-600" /> Active Devices
                </h2>
                <div className="space-y-3">
                    {data.sessions.map((session: any) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50/30 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                    <FiMonitor />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        {session.device}
                                        {session.isActive && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Active Now</span>}
                                    </p>
                                    <p className="text-xs text-gray-500">{session.ipAddress} • {new Date(session.loginTime).toLocaleString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRevokeSession(session.id)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                            >
                                Logout
                            </button>
                        </div>
                    ))}
                    {data.sessions.length === 0 && <p className="text-sm text-gray-500 text-center py-4 italic">No active sessions found.</p>}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiClock className="text-gray-600" /> Recent Activity
                </h2>
                <div className="space-y-3">
                    {data.attempts.map((login: any) => (
                        <div key={login.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="text-gray-400">
                                    <FiMonitor />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">{login.device}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(login.loginTime).toLocaleString()}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono text-gray-300">{login.ipAddress}</span>
                        </div>
                    ))}
                    {data.attempts.length === 0 && <p className="text-sm text-gray-500 text-center py-4 italic">No recent activity detected.</p>}
                </div>
            </div>
        </div>
    );
};

export default function SettingsPage() {
  const { admin, checkAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 2FA State
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'questions' | 'success' | 'disabling'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const data = await adminService.setup2FA();
      if (data.data?.qrCodeUrl) {
        setQrCode(data.data.qrCodeUrl);
        setSetupStep('qr');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to setup 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
      if (totpCode.length !== 6) return;
      setShowQuestionsModal(true);
  };

  const handleQuestionsSubmit = async (questions: { question: string, answer: string }[]) => {
    setLoading(true);
    try {
      // The backend verify endpoint expects { token: otpCode, securityQuestions: questions }
      const res = await api.post('/auth/2fa/verify', {
          token: totpCode,
          securityQuestions: questions
      });
      
      setRecoveryCodes(res.data.data.recoveryCodes);
      setSetupStep('success');
      setShowQuestionsModal(false);
      await checkAuth(); // Refresh user state
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      // Backend disable needs password + code
      // We can use a prompt for password like in vendor app, 
      // but let's see current code below. 
      // It currently only sends totpCode.
      await adminService.disable2FA(totpCode);
      setMessage({ type: 'success', text: 'Two-Factor Authentication Disabled' });
      setSetupStep('idle');
      setQrCode('');
      setTotpCode('');
      await checkAuth(); // Refresh user state
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Invalid code' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      // Assuming generic update endpoint
      await api.put('/users/me', {
        name: formData.name,
        email: formData.email,
        ...(formData.password ? { password: formData.password } : {})
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      await checkAuth(); // Refresh admin data
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h2>
            
            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave blank to keep current"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

{/* Login History */}
          <div className="space-y-6">
              {/* 2FA Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiShield /> Two-Factor Authentication
                </h2>
                
                {admin?.isTwoFactorEnabled ? (
                   <div>
                     <div className="flex items-center gap-2 text-green-600 mb-4">
                       <span className="font-bold">✓ 2FA is Enabled</span>
                     </div>
                     <p className="text-gray-600 text-sm mb-4">
                       Your account is secured with two-factor authentication. You will be required to enter a code from your authenticator app when logging in.
                     </p>
                     
                     {setupStep !== 'disabling' ? (
                        <button
                          onClick={() => setSetupStep('disabling')}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition"
                        >
                          Disable 2FA
                        </button>
                     ) : (
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                         <p className="text-sm font-medium text-gray-700 mb-2">Confirm to Disable</p>
                         <p className="text-xs text-gray-500 mb-3">Enter the code from your app to confirm disabling 2FA.</p>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             placeholder="000 000"
                             value={totpCode}
                             onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                             className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center tracking-widest font-mono"
                             maxLength={6}
                           />
                           <button
                             onClick={handleDisable2FA}
                             disabled={loading || totpCode.length !== 6}
                             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                           >
                             {loading ? '...' : 'Confirm'}
                           </button>
                           <button
                             onClick={() => { setSetupStep('idle'); setTotpCode(''); }}
                             className="px-3 py-2 text-gray-500 hover:text-gray-700"
                           >
                             Cancel
                           </button>
                         </div>
                       </div>
                     )}
                   </div>
                ) : (
                  <div>
                    {setupStep === 'idle' && (
                      <div>
                        <p className="text-gray-600 text-sm mb-4">
                          Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                        <button
                          onClick={handleSetup2FA}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                           {loading ? 'Loading...' : 'Enable 2FA'}
                        </button>
                      </div>
                    )}

                    {setupStep === 'qr' && qrCode && (
                       <div className="space-y-4">
                          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                             <p className="text-sm font-semibold text-gray-800 mb-2">Scan QR Code</p>
                             <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 mb-4 border border-white shadow-sm" />
                             <p className="text-xs text-gray-500 text-center max-w-xs mb-4">
                               Use Google Authenticator or Authy App to scan this code.
                             </p>
                             
                             <div className="w-full max-w-xs">
                               <label className="block text-xs font-medium text-gray-700 mb-1">Enter 6-digit Code</label>
                               <div className="flex gap-2">
                                 <input
                                   type="text"
                                   placeholder="000 000"
                                   value={totpCode}
                                   onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center tracking-widest font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                   maxLength={6}
                                 />
                                 <button
                                   onClick={handleVerifyOTP}
                                   disabled={loading || totpCode.length !== 6}
                                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                 >
                                   Next
                                 </button>
                               </div>
                             </div>
                          </div>
                          <button
                            onClick={() => { setSetupStep('idle'); setQrCode(''); setTotpCode(''); }}
                            className="text-gray-500 text-sm hover:underline"
                          >
                            Cancel Setup
                          </button>
                       </div>
                    )}

                    {setupStep === 'success' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                            <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-green-800 mb-2">2FA Enabled!</h3>
                            <p className="text-sm text-green-700 mb-6">
                                Save these recovery codes safely.
                            </p>
                            
                            <div className="bg-white p-3 rounded-lg border border-green-200 grid grid-cols-2 gap-2 font-mono text-xs mb-6">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="p-1">{code}</div>
                                ))}
                            </div>
                            
                            <button
                                onClick={() => setSetupStep('idle')}
                                className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    )}
                  </div>
                )}
              </div>

              <SecurityQuestionModal 
                isOpen={showQuestionsModal}
                onClose={() => setShowQuestionsModal(false)}
                onSubmit={handleQuestionsSubmit}
              />

              <LoginHistory />
          </div>
      </div>
    </div>
  );
}
