import { Outlet } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  ScanFace,
  Bluetooth,
  TrendingUp,
  Network,
  CheckCircle,
} from 'lucide-react';
import InstallPwaButton from '../common/InstallPwaButton';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center shadow-sm border border-slate-800">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">
                Smart Attendance System
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                VII Sem Capstone Architecture
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/architecture-diagram.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 transition-colors"
              title="View interactive system architecture diagram"
            >
              <Network className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Architecture Diagram</span>
              <span className="sm:hidden">Architecture</span>
            </a>
            <InstallPwaButton />
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Project Description & Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Production • Vercel Serverless &amp; MongoDB Atlas
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Smart Attendance System
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                The Smart Attendance System manages student attendance with rotating QR codes, facial verification with dynamic liveness, and Bluetooth proximity geofencing. Built for institutional rigor with automated debarment risk analytics.
              </p>
            </div>

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Feature 1 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-1 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    <QrCode className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <span>14s Rotating QR Codes</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  HMAC-SHA256 signed single-use tokens refresh every 14 seconds on faculty lecture projectors, preventing token copying and proxy scans.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-1 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    <ScanFace className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <span>Dynamic Face Liveness</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Webcam face embeddings matched against 128-dimensional vectors with real-time EAR (eye blink) and head yaw delta anti-spoofing checks.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-1 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    <Bluetooth className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <span>BLE Proximity Geofence</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Classroom Bluetooth beacon signal verification (-75 dBm threshold) ensures students are physically present inside the lecture hall.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-1 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <span>Debarment Risk Analytics</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Predictive Debarment Risk Index (DRI) calculations enforce the 75.0% statutory minimum attendance threshold with faculty watchlist alerts.
                </p>
              </div>
            </div>

            {/* Verification Specs Footer */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                PWA Offline Service Worker
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Timetable Sync Engine
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Role-Based RBAC Portals
              </span>
            </div>
          </div>

          {/* Right Column: Authentication Card (<Outlet />) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-md shadow-sm">
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      {/* Compliance & System Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-800">
          Smart Attendance System • Production Release 1.0.0
        </p>
        <p className="text-[11px] text-slate-500">
          Statutory 75.0% Attendance Minimum Threshold Enforced • Standard ASD-STE100 &amp; WCAG 2.1 AA Compliant
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;