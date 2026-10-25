import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { user, accessToken } = response.data.data;

      setAuth(user, accessToken);
      toast.success('Identity authenticated');

      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'faculty':
          navigate('/faculty');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          navigate('/login');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Authentication credentials rejected');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Sign In to Portal
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Enter your credentials to access your Smart Attendance System account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Institutional Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors"
              placeholder="name@university.edu"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full h-9 pl-9 pr-9 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 flex justify-center items-center gap-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Authenticating Credentials...</span>
            </>
          ) : (
            <>
              <span>Authenticate Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Unregistered student or faculty member?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
          >
            Register Institutional Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;