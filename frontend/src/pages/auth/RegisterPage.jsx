import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Hash, Building2, GraduationCap, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select role, 2: Fill details
  const [selectedRole, setSelectedRole] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    enrollmentNumber: '',
    employeeId: '',
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get('/api/departments');
        setDepartments(res.data.data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const roles = [
    { id: 'student', name: 'Student', icon: GraduationCap, description: 'Mark attendance, view history' },
    { id: 'faculty', name: 'Faculty', icon: User, description: 'Create sessions, manage classes' },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;
      if (formData.role === 'student') {
        response = await authAPI.registerStudent(formData);
      } else if (formData.role === 'faculty') {
        response = await authAPI.registerFaculty(formData);
      } else {
        response = await authAPI.register(formData);
      }

      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      toast.success('Registration successful!');

      // Navigate based on role
      switch (user.role) {
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
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Create an account</h2>
        <p className="mt-2 text-sm text-gray-300">
          {step === 1 ? 'Select your role to get started' : 'Fill in your details'}
        </p>
      </div>

      {step === 1 ? (
        /* Step 1: Role Selection */
        <div className="space-y-4">
          <div className="grid gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id)}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  selectedRole === role.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedRole === role.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{role.name}</p>
                  <p className="text-sm text-gray-400">{role.description}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      ) : (
        /* Step 2: Registration Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Create a password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Department Field */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-200 mb-1">
              Department
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="" className="bg-gray-800">Select department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id} className="bg-gray-800">
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Enrollment Number (Student only) */}
          {selectedRole === 'student' && (
            <div>
              <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-200 mb-1">
                Enrollment Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  type="text"
                  required
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your enrollment number"
                />
              </div>
            </div>
          )}

          {selectedRole === 'faculty' && (
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-200 mb-1">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your employee ID"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-2.5 px-4 text-gray-300 hover:text-white transition-colors"
          >
            Back to role selection
          </button>
        </form>
      )}

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-300">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;