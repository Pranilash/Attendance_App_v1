import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
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
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Smart Attendance System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Secure QR & Face Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/20">
          <Outlet />
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        <p>© 2024 Smart Attendance System. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthLayout;