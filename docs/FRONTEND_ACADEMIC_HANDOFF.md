# Frontend Engineering Handoff: Institutional Academic Attendance System

> **Target Audience**: Incoming Frontend Engineers and Autonomous AI Agents.  
> **Repository**: `Attendance_App_v1`.  
> **Production URL**: https://attendanceappv1.vercel.app.  
> **Backend Architecture**: Express.js Serverless with MongoDB Atlas Cloud.  
> **Frontend Stack**: React 18, Vite 6, Tailwind CSS 3, Zustand, Axios, PWA.

---

## 1. Executive Summary & Vision

The objective is to transform the existing working prototype into an **enterprise-grade Academic Attendance and Lecture Management System** tailored for university and college campuses.

An academic institution requires:
1. **Dignified, Authoritative Aesthetics**: Clean institutional typography, high-contrast visual cues, zero clutter, and predictable navigation.
2. **Lecture Hall Ergonomics**:
   - **For Faculty**: Fullscreen projector display mode with dynamic 14-second rotating QR codes, live incoming attendance ticker, and debarment risk alerts.
   - **For Students**: Mobile-first PWA with zero-latency biometric verification, camera guides, and real-time attendance margin calculators.
   - **For Deans & Administrators**: High-density data tables, institutional KPIs, department rosters, and automated audit logs.

---

## 2. Workspace Skills Playbook

This workspace contains specialized engineering plugins under `.agents/plugins/` and skills under `.agents/skills/`. Use them systematically according to the following matrix:

| Task / Need | Primary Skill | Execution Guidelines |
|---|---|---|
| **Design System & Component Styling** | `frontend-ui-engineering` | Build reusable UI primitives (cards, data tables, modals, badges). Enforce WCAG AA accessibility, keyboard navigation, and responsive breakpoints. |
| **Browser Testing & Visual Audits** | `browser-testing-with-devtools` | Launch real browser subagents to record user flows, inspect console errors, verify network requests, and audit visual layout across viewports. |
| **Bundle & Runtime Speed** | `performance-optimization` | Implement `React.lazy()` chunking for heavy face-api models and charts. Optimize PWA cache storage and eliminate unnecessary re-renders. |
| **API Contract & State Flow** | `api-and-interface-design` | Keep typed contracts between backend `/api` endpoints and Axios services. Handle network dropouts, 401 token refreshes, and rate-limit backoffs cleanly. |
| **Security & Biometric Privacy** | `security-and-hardening` | Sanitize all DOM inputs, ensure camera streams stop on component unmount, and prevent storing raw biometrics in local storage. |
| **Clarity & Specifications** | `asd-ste100` | Write technical specifications, tool descriptions, and error messages in Simplified Technical English to avoid multi-agent miscommunication. |
| **Code Simplicity & Zero Bloat** | `ponytail` | Prefer minimal diffs. Avoid introducing unnecessary third-party npm libraries when native browser APIs or Tailwind utilities suffice. |
| **Architecture & Diagrams** | `archify` | Generate standalone interactive HTML/SVG architecture and sequence diagrams for complex user flows (e.g. dynamic biometric challenge sequence). |

---

## 3. Academic Design System & UI Specifications

### 3.1 Color Palette (Institutional Trust & Clarity)
Avoid generic bright colors. Use tailored HSL / Tailwind colors designed for university portals:

- **Primary Brand (Oxford Navy)**: `slate-900` (`#0f172a`) and `indigo-900` (`#1e1b4b`) for sidebars, top headers, and primary emphasis.
- **Academic Accent (Cobalt Blue)**: `indigo-600` (`#4f46e5`) and `blue-600` (`#2563eb`) for primary actions, active tab pills, and focus rings.
- **Verification Emerald**: `emerald-600` (`#059669`) / `emerald-50` (`#ecfdf5`) for successful biometric match, present status, and safe attendance margins (>75%).
- **Warning Amber**: `amber-500` (`#f59e0b`) / `amber-50` (`#fffbeb`) for marginal attendance risk (65%–74%) and Bluetooth proximity warnings.
- **Debarment Crimson**: `rose-600` (`#e11d48`) / `rose-50` (`#fff1f2`) for debarment risk (<65%), failed liveness verification, and expired sessions.
- **Surface & Canvas**: `slate-50` (`#f8fafc`) for background canvas. `white` (`#ffffff`) for elevated cards with subtle borders (`border-slate-200/80`).

### 3.2 Typography Hierarchy
- **Font Family**: Modern sans-serif (Inter or Plus Jakarta Sans).
- **Page Titles**: `text-2xl font-bold tracking-tight text-slate-900`
- **Section Headers**: `text-base font-semibold text-slate-800`
- **Meta / Labels**: `text-xs font-medium uppercase tracking-wider text-slate-500`
- **Body & Table Text**: `text-sm text-slate-700`

### 3.3 Micro-Interactions & UX States
1. **Loading States**: Never display blank screens. Display shimmer skeleton placeholders matching table row heights and card dimensions.
2. **Feedback Banners**: Distinct toast notifications using `react-hot-toast` with clear instructional recovery steps.
3. **Empty States**: Institutional empty state illustrations with clear call-to-action buttons ("No classes scheduled today", "All students currently above safe attendance threshold").

---

## 4. Role-Specific Feature Requirements

### 4.1 Student Portal (`/student/*`)

```
Student Portal Layout
├── /student (Student Dashboard)
│   ├── Attendance Metric Cards (% attended, classes required for 75%)
│   ├── Predictive Debarment Risk Index (DRI) Indicator
│   └── Today's Timetable Schedule Widget
├── /student/scan (QR Scanner & Verification)
│   ├── Camera Scanner with target crosshairs
│   └── Bluetooth Low Energy (BLE) proximity badge
├── /student/verify-face (Biometric Verification)
│   ├── Video feed with face alignment oval reticle
│   └── Dynamic Liveness HUD (Blink / Head Turn prompt badges)
├── /student/register-face (One-time Biometric Enrollment)
└── /student/history (Attendance Records & Class Filter)
```

#### Key Student Features to Implement / Enhance:
1. **Attendance Margin Calculator**:
   - Display circular percentage gauge.
   - Display actionable calculations:
     - If `< 75%`: *"You must attend the next **N** consecutive classes to attain eligibility."*
     - If `≥ 75%`: *"You can safely miss **N** classes before dropping below eligibility."*
2. **Biometric Capture HUD**:
   - Render an interactive facial bounding reticle over the webcam stream.
   - Display clear prompts for server-issued challenge sequences (`blink`, `turnLeft`, `turnRight`).
   - Automatically stop video streams (`stream.getTracks().forEach(t => t.stop())`) whenever the user navigates away or verification completes.
3. **PWA Offline & Model Caching**:
   - Model weights (`@vladmandic/face-api`) must precache via service worker so verification loads instantly even on weak campus Wi-Fi.

---

### 4.2 Faculty Portal (`/faculty/*`)

```
Faculty Portal Layout
├── /faculty (Faculty Overview Dashboard)
│   ├── Quick Class Launchpad
│   └── Critical Debarment Watchlist Alert Banner
├── /faculty/session (Active Attendance Control Center)
│   ├── Classroom Projector Mode (Fullscreen rotating QR)
│   ├── Live Incoming Attendance Feed (Auto-updating student roster)
│   └── Manual Student Attendance Override Toggle
├── /faculty/classes (Class & Student Roster Management)
├── /faculty/debarment (Debarment Watchlist Analytics - VII Sem Upgrade 4)
└── /faculty/reports (Attendance Ledger & CSV Export)
```

#### Key Faculty Features to Implement / Enhance:
1. **Classroom Projector Mode**:
   - Fullscreen button designed for lecture hall HDMI/projector output.
   - High-contrast, large-format rotating QR code with a circular countdown ring indicating the 14-second refresh cycle.
   - Real-time side drawer displaying students as they verify their attendance in the room.
2. **Debarment Watchlist (VII Sem Upgrade 4)**:
   - Dedicated filterable data grid for students falling below the 75% institutional attendance cutoff.
   - Calculation formula: $\text{DRI} = 1.0 - (\text{Attended} / \text{Conducted})$.
   - Instant export of official debarment reports in CSV format.
3. **Timetable Synchronization (VII Sem Upgrade 5)**:
   - Synchronize attendance sessions with scheduled timetable slots (`/api/faculty/timetable`).
   - Auto-fill subject, class section, and scheduled lecture duration.

---

### 4.3 Administrator Portal (`/admin/*`)

```
Admin Portal Layout
├── /admin (Campus KPI Dashboard)
│   ├── Total Students, Faculty, Departments, and Classes
│   └── Daily Campus Check-in Volume Trend
├── /admin/departments (Department Management)
├── /admin/faculty (Faculty User Accounts & Subject Assignment)
└── /admin/students (Student Directory & Biometric Reset Controls)
```

#### Key Admin Features to Implement / Enhance:
1. **Data Density & Search Filtering**:
   - Server-paginated data grids with instant search by enrollment number, faculty employee ID, or department.
2. **Biometric Administration**:
   - Campus registrars can reset student biometric status when a student requires facial re-registration.
3. **Department Roster Control**:
   - Bulk enrollment of student cohorts into department programs.

---

## 5. Technical Architecture & File Organization

```
frontend/src/
├── components/
│   ├── common/             # Reusable UI primitives (Button, Modal, Card, Badge, Table, Input)
│   ├── layout/             # Navbar, Sidebar, PageHeader, ProtectedRoute
│   ├── face/               # FaceCapture, LivenessReticle, CameraGuide
│   ├── qr/                 # QRScanner, ProjectorQRDisplay, RefreshCountdown
│   └── timetable/          # TimetableGrid, SlotCard
├── pages/
│   ├── auth/               # Login, Profile
│   ├── admin/              # AdminDashboard, ManageDepartments, ManageFaculty, ManageStudents
│   ├── faculty/            # FacultyDashboard, SessionControl, ManageClasses, AttendanceReports
│   └── student/            # StudentDashboard, ScanQR, FaceVerification, FaceRegistration, AttendanceHistory
├── services/
│   ├── api.js              # Centralized Axios instance with auth interceptors
│   ├── authService.js      # Login, me, token refresh
│   ├── facultyService.js   # Class, session, debarment watchlist, CSV export
│   └── studentService.js   # Scan, face verify, timetable, stats
└── store/
    ├── authStore.js        # Global user auth, tokens, role permissions
    └── sessionStore.js     # Active classroom session state
```

---

## 6. Implementation Plan: 5-Phase Roadmap

### Phase 1: Institutional Design System Foundation
- Refactor `src/components/common/` with cohesive design tokens (buttons, tables, cards, badges, modal dialogs).
- Standardize top navigation and collapsible sidebar in `src/components/layout/`.
- Ensure standard dark/light surface contrast and remove ad-hoc inline styles.

### Phase 2: Lecture Hall Projector Mode & Faculty Command Center
- Upgrade `src/pages/faculty/SessionControl.jsx` with a dedicated "Projector View" mode.
- Integrate 14-second visual progress ring displaying countdown to the next rotating QR signature.
- Build live attending student card drawer with instant counters.

### Phase 3: Student Mobile PWA & Camera Reticle HUD
- Refactor `src/components/face/FaceCapture.jsx` to render an active face detection oval with guide landmarks.
- Integrate step-by-step liveness prompt cards with smooth transition animations.
- Ensure camera resource cleanup in `useEffect` return functions.

### Phase 4: Debarment Risk Index (DRI) & Timetable Integration
- Enhance `src/pages/student/StudentDashboard.jsx` with the attendance margin calculator card.
- Build `src/pages/faculty/DebarmentWatchlist.jsx` with tabular filtering (`<75%`, `<65%`) and instant CSV download.
- Integrate timetable weekly calendar grid from `/api/student/timetable` and `/api/faculty/timetable`.

### Phase 5: Comprehensive Browser Verification & Accessibility
- Run the autonomous test suite `node professional-backend-structure-main/src/scripts/testAllEndpointsLive.js` to ensure 100% backend endpoint pass rate.
- Execute browser subagent tests using the `browser-testing-with-devtools` skill to verify responsive rendering across mobile (390px) and desktop (1440px) viewports.

---

## 7. Verified Test Credentials & Live Endpoints

The system is fully connected to the live MongoDB Atlas database and Vercel serverless backend:

- **Live URL**: `https://attendanceappv1.vercel.app`
- **Backend API**: `https://attendanceappv1.vercel.app/api`
- **Health Endpoint**: `https://attendanceappv1.vercel.app/health`

| Role | Username | Password | Biometric Status |
|---|---|---|---|
| **Administrator** | `admin@attendance.edu` | `Admin@123456` | Bypass |
| **Faculty Member**| `priya.sharma@attendance.edu` | `Faculty@123` | Bypass |
| **Enrolled Student**| `arjun.reddy@attendance.edu` | `Student@123` | **Registered** (128-dim embedding loaded) |

---

## 8. Development Commands

```bash
# Install root and workspace dependencies
npm install

# Start local backend server (Port 8000)
npm run dev:backend

# Start local frontend server (Port 5173)
npm run dev:frontend

# Run 40-endpoint live regression test suite
node professional-backend-structure-main/src/scripts/testAllEndpointsLive.js

# Build production bundle
npm run build
```
