import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiMail } from 'react-icons/fi';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
       showError('Please enter a valid email address.', 'Invalid Email');
       return;
    }

    showLoading('Logging in...');

    try {
      await login({ email, password });
      closeLoading();
      showSuccess('Welcome back!', 'Login Successful');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      closeLoading();
      let errorMessage = err.response?.data?.message || 'Failed to login. Check credentials.';
      if (err.response?.data?.data?.attemptsLeft !== undefined) {
         errorMessage += ` (${err.response.data.data.attemptsLeft} attempts remaining)`;
      }
      showError(errorMessage, 'Login Failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md px-8 py-10 relative z-10 mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D8C3A5]/20 mb-4">
             {/* Using a chat-like icon to match the image's whatsapp feel, or keep generic */}
             <FiMail className="text-3xl text-[#D4AF37]" /> 
          </div>
          <h1 className="text-3xl font-bold text-[#4A3728] mb-2">Welcome Back</h1>
          <p className="text-[#4A3728]/70 text-sm">ADMIN LOGIN</p>
        </div>



        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#4A3728]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full px-4 py-3.5 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-[#4A3728] placeholder-gray-400 font-medium"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#4A3728]">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-[#D4AF37] hover:text-[#B3902E] transition-colors">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-4 py-3.5 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-[#4A3728] placeholder-gray-400 font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#D8C3A5] hover:bg-[#D4AF37] text-[#4A3728] py-3.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 text-base"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#4A3728]/70 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-[#D8C3A5] hover:text-[#D4AF37] transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
