import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Hash, Building2, GraduationCap, Loader2, ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react';
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
        setDepartments(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const roles = [
    {
      id: 'student',
      name: 'Enrolled Student',
      icon: GraduationCap,
      description: 'Course enrollment roster, biometric attendance, and debarment risk tracking',
    },
    {
      id: 'faculty',
      name: 'Faculty Instructor',
      icon: User,
      description: 'Session administration, lecture projector HUD, and statutory attendance reporting',
    },
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
      toast.error('Please select an institutional role');
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
      toast.success('Institutional registration complete');

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
      toast.error(error.response?.data?.message || 'Registration transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          {step === 1 ? 'Select Institutional Role' : 'Institutional Registry Details'}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {step === 1
            ? 'Choose your primary university affiliation to configure access permissions'
            : 'Enter official academic identification to provision account in ledger'}
        </p>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid gap-2.5">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id)}
                className={`flex items-start gap-3 p-3 text-left rounded-md border transition-all ${
                  selectedRole === role.id
                    ? 'border-blue-700 bg-blue-50/60 ring-1 ring-blue-700'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                    selectedRole === role.id
                      ? 'bg-blue-700 text-white border-blue-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <role.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{role.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{role.description}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="w-full h-9 flex justify-center items-center gap-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <span>Proceed to Identity Information</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Legal Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors"
                placeholder="Dr. Jane Smith or John Doe"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
                placeholder="identity@university.edu"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Account Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full h-9 pl-9 pr-9 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors"
                placeholder="Minimum 8 characters"
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

          {/* Department Selection */}
          <div>
            <label htmlFor="department" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Academic Department
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <select
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="block w-full h-9 pl-9 pr-8 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors appearance-none"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code || 'DEPT'})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Student Enrollment Number */}
          {selectedRole === 'student' && (
            <div>
              <label htmlFor="enrollmentNumber" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Matriculation / Enrollment Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  type="text"
                  required
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  className="block w-full h-9 pl-9 pr-3 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors uppercase"
                  placeholder="e.g. 0101CS211042"
                />
              </div>
            </div>
          )}

          {/* Faculty Employee ID */}
          {selectedRole === 'faculty' && (
            <div>
              <label htmlFor="employeeId" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Faculty Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="block w-full h-9 pl-9 pr-3 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-colors uppercase"
                  placeholder="e.g. FAC-2024-009"
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 flex justify-center items-center gap-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enrolling Account in Ledger...</span>
                </>
              ) : (
                <>
                  <span>Complete Institutional Registration</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full h-9 flex items-center justify-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Role Selection</span>
            </button>
          </div>
        </form>
      )}

      {/* Login Navigation Link */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Already registered in institutional registry?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
          >
            Authenticate Session
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;