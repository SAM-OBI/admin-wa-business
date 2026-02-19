import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VENDORS' | 'CUSTOMERS'>('ADMIN');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email)) {
      showError('Please enter a valid email address.', 'Invalid Email');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      showError('Password must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number, and 1 special char.', 'Weak Password');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.', 'Password Mismatch');
      return;
    }

    showLoading('Creating your account...');

    try {
      // Attempt registration
      await register({ name, email, phone, password, role });
      
      closeLoading();
      showSuccess('Account created successfully! Redirecting to login...', 'Welcome!');
      
      // Navigate to login after successful registration
      setTimeout(() => {
         navigate('/login');
      }, 2000);

    } catch (err: any) {
      closeLoading();
      showError(err.response?.data?.message || 'Failed to create account.', 'Registration Failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md px-8 py-6 relative z-10 mx-auto border border-gray-100">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-[#4A3728] mb-1">Create Account</h1>
        </div>



        <form onSubmit={handleSubmit} className="space-y-3">
           <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#4A3728]">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full px-4 py-3 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-gray-900 placeholder-gray-700 font-medium"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#4A3728]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full px-4 py-3 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-gray-900 placeholder-gray-700 font-medium"
              placeholder="admin@shopvia.ng"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#4A3728]">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="block w-full px-4 py-3 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-gray-900 placeholder-gray-700 font-medium"
              placeholder="+234 800 000 0000"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#4A3728]">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'VENDORS' | 'CUSTOMERS')}
              required
              className="block w-full px-4 py-3.5 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-[#4A3728] font-medium"
            >
              <option value="ADMIN">Admin</option>
              <option value="VENDORS">Vendor</option>
              <option value="CUSTOMERS">Customer</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#4A3728]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-4 py-3 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-gray-900 placeholder-gray-700 font-medium"
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-1.5">
             <label className="block text-sm font-semibold text-[#4A3728]">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-full px-4 py-3 bg-[#F5F5DC]/50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none text-gray-900 placeholder-gray-700 font-medium"
              placeholder="••••••••"
            />
          </div>

         <button
            type="submit"
            className="w-full bg-[#D8C3A5] hover:bg-[#D4AF37] text-[#4A3728] py-3.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 text-base"
          >
            Sign Up
          </button>
        </form>


      </div>
    </div>
  );
}
