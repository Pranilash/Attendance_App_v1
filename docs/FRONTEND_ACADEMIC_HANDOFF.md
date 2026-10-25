# Frontend Engineering Handoff: Institutional Academic Attendance System

> **Document Type**: Frontend Architecture and UI Specification.  
> **Target Audience**: Frontend Engineers and AI Agents.  
> **Repository**: `Attendance_App_v1`.  
> **Production Deployment**: https://attendanceappv1.vercel.app.  
> **Standard Compliance**: ASD-STE100 and WCAG 2.1 AA.

---

## 1. Executive Directive: Eliminating AI Slop

Generic AI generators produce predictable visual errors. They add purple gradients, giant rounded pills, oversized padding, and low information density.

Academic software requires a different approach. Professors, registrars, and university students need an **authoritative, high-density institutional system**. The user interface must look like enterprise higher-education software (similar to Canvas, Banner, or Workday Student).

### AI Slop Patterns to Reject vs Academic Production Standards

| AI Slop Pattern | Why It Fails | Institutional Academic Standard |
|---|---|---|
| **Purple/Indigo Gradients** (`bg-gradient-to-r from-purple-500 to-indigo-600`) | Distracting, looks like a crypto landing page, washes out on lecture projectors | Solid Oxford Navy (`#0f172a`) and crisp Slate borders (`#e2e8f0`) |
| **Pill Buttons Everywhere** (`rounded-full py-4 px-8`) | Wastes vertical space, signals a mobile toy app | Tailored button radii (`rounded-md text-xs font-semibold px-3 py-2`) |
| **Card Floods** (rendering tables as floating cards) | Low data density. Faculty cannot scan 80 students | Compact data tables (36px row height, sticky headers, zebra stripes) |
| **Vague Marketing Copy** ("Welcome to your attendance journey!") | Unprofessional, confuses academic users | Exact university nomenclature ("Department of Computer Science", "Term VII") |
| **Excessive Whitespace** (`p-10 gap-8` on utility screens) | Requires continuous scrolling to see basic student rosters | Information-dense grids with 16px padding and compact typography |
| **Low-Contrast Grays** (`text-gray-400` on white) | Fails accessibility, unreadable on classroom projectors | High-contrast text (`text-slate-900` for titles, `text-slate-700` for body) |
| **Glow & Blur Effects** (`backdrop-blur-xl shadow-2xl`) | Heavy rendering cost on student mobile devices | Clean hairline borders (`border border-slate-200`) and subtle elevation |

---

## 2. Institutional Visual Design System

### 2.1 Color Tokens

Do not use decorative rainbow gradients. Use functional, high-contrast academic colors:

- **Institutional Primary (Oxford Slate)**: `slate-900` (`#0f172a`) for header bars, primary buttons, and authoritative text.
- **Academic Accent (Cobalt)**: `blue-700` (`#1d4ed8`) for interactive links, tab highlights, and focus rings.
- **Canvas & Surfaces**:
  - Main background: `slate-50` (`#f8fafc`)
  - Elevated surfaces (cards, table containers): `white` (`#ffffff`)
  - Subdued panels: `slate-100` (`#f1f5f9`)
  - Hairline dividers: `slate-200` (`#e2e8f0`)
- **Status Indicators (High Contrast, Muted Backgrounds)**:
  - **Present / Eligible (>75%)**: `emerald-700` (`#047857`) text on `emerald-50` (`#ecfdf5`) background, `emerald-200` border.
  - **Marginal Risk (65%–74%)**: `amber-700` (`#b45309`) text on `amber-50` (`#fffbeb`) background, `amber-200` border.
  - **Debarred / Critical (<65%)**: `rose-700` (`#b91c1c`) text on `rose-50` (`#fff1f2`) background, `rose-200` border.

### 2.2 Typography & Numerical Formatting

- **Font Family**: Inter, system sans-serif fallback.
- **Numerical Alignment**: Use `font-mono tabular-nums` for roll numbers, timestamps, percentages, and session countdowns.
- **Text Alignment Rules**:
  - Text columns (names, course titles): **Left-aligned**.
  - Status badges and codes: **Centered**.
  - Quantitative figures (attendance counts, percentages): **Right-aligned**.

### 2.3 Component Dimension Tokens

- **Input Fields & Buttons**: `h-9 px-3 text-xs` (compact, precise).
- **Table Rows**: `h-10 px-4 py-2 text-xs` (allows 15+ student rows visible without scrolling).
- **Corner Radii**: `rounded-md` (4px to 6px). Do not use `rounded-2xl` or `rounded-3xl`.
- **Badges**: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium`.

---

## 3. Academic Domain Microcopy

Do not use casual phrases. Use formal academic registrar terminology:

| Casual Phrase (Do Not Use) | Academic Domain Term (Use This) |
|---|---|
| "My Classes" | "Enrolled Courses" |
| "Take Attendance" | "Start Attendance Session" |
| "You're Doing Great!" | "Current Attendance: 82.5% (Eligible)" |
| "Danger Zone / Warning" | "Debarment Risk (Below 75.0% Statutory Minimum)" |
| "Face Scan Box" | "Biometric Verification Viewfinder" |
| "Admin Stuff" | "Registrar & Department Administration" |
| "Class Members" | "Course Enrollment Roster" |

---

## 4. Production UI Component Blueprints

### 4.1 Roster Data Table (`src/components/common/AcademicTable.jsx`)

Provide an enterprise-grade table for faculty gradebooks and student rosters:

```jsx
// Specifications:
// - Sticky header row with dark text on slate-100 background.
// - Fixed column widths to prevent layout jumps.
// - Right-aligned numerical columns with monospaced tabular figures.
// - Row hover state with hairline border dividers.

export function AcademicTable({ columns, data }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                style={{ width: col.width || 'auto' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-150 text-slate-700">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-2 ${col.align === 'right' ? 'text-right font-mono tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4.2 Lecture Hall Projector HUD (`src/pages/faculty/SessionControl.jsx`)

Lecture projectors require high contrast and zero decorative clutter:

1. **Header**: Course code, section name, and room number visible from 20 meters (`text-2xl font-bold text-slate-900`).
2. **Rotating QR Frame**:
   - Clean 320px x 320px white canvas with a sharp 2px solid border (`border-slate-300`).
   - SVG circular progress ring indicating the 14-second rotation interval.
   - Text indicator below the code: `"Rotates every 14s • Dynamic HMAC-SHA256 Signed"`.
3. **Live Roster Drawer**:
   - Split-screen right column displaying incoming student verifications in real time.
   - High-contrast counter: `Attended: 42 / 60 (70.0%)`.

### 4.3 Biometric Verification Viewfinder (`src/components/face/FaceCapture.jsx`)

Do not display a generic video box with cartoon borders. Use a biometric HUD:

1. **Webcam Viewfinder Frame**:
   - 4:3 aspect ratio with hairline corner alignment brackets (`w-6 h-6 border-2 border-blue-500`).
   - Subtle semi-transparent oval face silhouette guiding the student to position their head.
2. **Dynamic Challenge Pill**:
   - High-visibility status badge above the video feed.
   - Example: `[ACTION 1/2: BLINK SLOWLY]` in amber when awaiting eye blink. Changes to `[VERIFIED]` in emerald upon detection.
3. **Stream Teardown**:
   - Enforce explicit camera cleanup on unmount:
     ```javascript
     useEffect(() => {
       return () => {
         if (streamRef.current) {
           streamRef.current.getTracks().forEach((track) => track.stop());
         }
       };
     }, []);
     ```

### 4.4 Debarment Risk Margin Widget (`src/pages/student/StudentDashboard.jsx`)

Display exact numerical margin calculations rather than vague progress bars:

```jsx
// Academic calculation logic:
// Total Conducted Sessions: C
// Attended Sessions: A
// Required Statutory Threshold: 75% (0.75)
//
// If (A / C) < 0.75:
//   Needed consecutive classes to reach 75%: Math.ceil((0.75 * C - A) / 0.25)
// If (A / C) >= 0.75:
//   Permissible safe absences before falling below 75%: Math.floor((A - 0.75 * C) / 0.75)
```

Display these values in an institutional metric card:
- Monospaced fraction: `18 / 24 Sessions Attended (75.0%)`
- Status pill: `Statutory Minimum Satisfied`
- Advisory notice: `"You can miss 0 additional lectures before debarment risk."`

---

## 5. Screen-by-Screen Refactoring Instructions

### 5.1 Admin Portal Refactoring (`/admin/*`)

1. **`AdminDashboard.jsx`**:
   - Replace oversized metric cards with an institutional KPI grid (4 columns: Total Students, Total Faculty, Active Courses, Daily Attendance Volume).
   - Display a compact tabular ledger of today's attendance sessions.
2. **`ManageStudents.jsx` & `ManageFaculty.jsx`**:
   - Replace any card layouts with `AcademicTable`.
   - Add search input with instantaneous client-side filter by enrollment number or department code.
   - Provide explicit action buttons (`View Record`, `Reset Biometrics`) in table action cells.

### 5.2 Faculty Portal Refactoring (`/faculty/*`)

1. **`FacultyDashboard.jsx`**:
   - Place an immediate "Active Class Launchpad" at the top of the screen.
   - If students in any assigned course are below 75% attendance, display a compact red warning banner: `"Debarment Watchlist Alert: N students below 75.0% threshold"`.
2. **`AttendanceReports.jsx`**:
   - Ensure the CSV export button uses standard university column headers (`Enrollment Number`, `Student Name`, `Department`, `Attended Sessions`, `Total Sessions`, `Attendance Percentage`, `Debarment Status`).

### 5.3 Student Portal Refactoring (`/student/*`)

1. **`StudentDashboard.jsx`**:
   - Display the student's primary course table with columns: `Course Code`, `Course Title`, `Faculty`, `Attended / Held`, `Percentage`, `Eligibility Status`.
2. **`ScanQR.jsx`**:
   - Ensure the camera scanner renders a high-contrast targeting square with hairline corners.
   - Display the classroom BLE proximity verification indicator when beacon verification is active.

---

## 6. Engineering Plugin Execution Guide

Incoming engineers and autonomous agents must invoke the workspace tools for each task:

1. **Styling and Component Structure**:
   - Apply `frontend-ui-engineering` to ensure all components use strict tokens from `src/index.css` rather than ad-hoc inline styles.
2. **Browser Validation**:
   - Use `browser-testing-with-devtools` to start headless and visible browser subagents.
   - Audit viewports: Mobile (390px x 844px), Tablet (768px x 1024px), Desktop (1440px x 900px).
3. **Performance Optimization**:
   - Apply `performance-optimization` to verify bundle sizes.
   - Ensure face-api models load asynchronously and precache through the service worker.
4. **Codebase Memory & Impact**:
   - Use `codebase-memory` (`search_graph`, `search_code`) to trace endpoint connections and props before renaming interfaces.

---

## 7. Verification & Quality Acceptance Criteria

Before marking any frontend task complete, verify these gates:

1. **Zero Console Errors**: No unhandled React lifecycle warnings or face-api WebGL errors in browser DevTools.
2. **Live Backend Sync**: All components must fetch and mutate live data on `https://attendanceappv1.vercel.app` backed by MongoDB Atlas.
3. **Automated Test Run**:
   ```bash
   node professional-backend-structure-main/src/scripts/testAllEndpointsLive.js
   ```
   Must pass with **40 / 40 Passed (100%)**.
4. **Documentation Compliance**:
   ```bash
   python .agents/skills/asd-ste100/scripts/ste-lint.py docs/FRONTEND_ACADEMIC_HANDOFF.md
   ```
   Must pass with **0 violations**.
