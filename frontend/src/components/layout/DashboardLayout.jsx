import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  QrCode,
  History,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Building2,
  Camera,
  Network,
} from 'lucide-react';
import InstallPwaButton from '../common/InstallPwaButton';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on role
  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Departments', path: '/admin/departments', icon: Building2 },
          { name: 'Faculty', path: '/admin/faculty', icon: Users },
          { name: 'Students', path: '/admin/students', icon: GraduationCap },
        ];
      case 'faculty':
        return [
          { name: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
          { name: 'Courses', path: '/faculty/classes', icon: BookOpen },
          { name: 'Session Control', path: '/faculty/session', icon: QrCode },
          { name: 'Reports', path: '/faculty/reports', icon: BarChart3 },
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
          { name: 'Scan QR', path: '/student/scan', icon: QrCode },
          { name: 'Attendance History', path: '/student/history', icon: History },
          { name: 'Register Face', path: '/student/register-face', icon: Camera },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return { label: 'Registrar', color: 'bg-rose-50 text-rose-700 border border-rose-200' };
      case 'faculty':
        return { label: 'Faculty', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
      case 'student':
        return { label: 'Student', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
      default:
        return { label: user?.role, color: 'bg-slate-100 text-slate-700 border border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — institutional Oxford Slate */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-white tracking-wide">Smart Attendance</span>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/faculty' || item.path === '/student'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User info at bottom */}
          <div className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user?.name}
                </p>
                <span
                  className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top header — clean, compact, institutional */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-12 px-4 sm:px-5">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Title */}
            <div className="hidden lg:block">
              <h1 className="text-sm font-semibold text-slate-900">
                Smart Attendance System
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <a
                href="/architecture-diagram.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                title="View interactive system architecture diagram"
              >
                <Network className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Architecture</span>
              </a>

              <InstallPwaButton />

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-slate-100"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-7 h-7 bg-slate-200 rounded-md flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-slate-700">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-20">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900">
                          {user?.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{user?.email}</p>
                      </div>
                      <a
                        href="/architecture-diagram.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Network className="w-3.5 h-3.5 text-slate-500" />
                        Architecture Map
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-700 hover:bg-rose-50"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;