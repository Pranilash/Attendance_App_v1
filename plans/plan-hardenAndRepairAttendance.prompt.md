# Smart Attendance System (SAS) — Hardening, Tally Alignment & Future Scopes Plan

Comprehensive alignment of the **Smart Attendance System (SAS)** codebase with the B.Tech Project Report (*IIIT Lucknow, May 2026*) and implementation roadmap for hardening defects and executing future scopes (BLE proximity verification, PWA/mobile readiness, offline sync, enhanced liveness, automated alerts, trend analytics, and ERP integration).

---

## 1. Specification Tally & Reconciliation Matrix

| Dimension | B.Tech Report Specification (May 2026) | Existing Codebase State | Plan Alignment / Remediation |
|---|---|---|---|
| **Architecture** | 3-Tier: Presentation (React), Application (Express REST API), Data (MongoDB) (Sec 3.1) | Matches: React 18 frontend + Express.js backend + MongoDB Mongoose | Retain 3-tier structure; enforce strict MVC and clear route separation. |
| **Tech Stack** | Frontend: React 18, Vite, Tailwind CSS, Zustand, Axios, react-router-dom, face-api.js, html5-qrcode. Backend: Node.js, Express.js, MongoDB (Mongoose), JWT, Zod, Helmet, CORS, Rate Limit (Sec 4.1) | Dependencies present in `frontend/package.json` and backend `package.json` | Reconcile outdated ESLint/lint configurations and remove unused route helpers. |
| **User Roles** | Administrator, Faculty Member, Student (Sec 3.3.1) | Three roles in `AttendanceUser` (`admin`, `faculty`, `student`) | Restrict self-registration to students only; faculty and admin created via admin routes. |
| **Authentication & Tokens** | JWT Access & Refresh tokens, secure cookie session handling (Sec 3.3.1, 3.6) | Access tokens returned in JSON & stored in `localStorage`; refresh token partially in cookies | Enforce 100% HttpOnly cookie auth for both access & refresh tokens; remove tokens from JSON responses and Zustand storage. |
| **QR Verification** | Dynamic, time-sensitive (15s default), HMAC-SHA256 signed with session secret (Sec 3.3.2) | HMAC signing exists in `faculty.controller.js` and `verifyQR` in `student.controller.js` | Enforce 30s max tolerance window, reject future timestamps, and bind QR success to a server-issued challenge token. |
| **Face Verification** | 128D facial embeddings generated via `face-api.js`, compared via cosine similarity with stored embedding (Sec 3.3.3) | `verifyFaceEmbedding` in `faceVerification.util.js` with Euclidean/Cosine comparison | Standardize Euclidean distance <= 0.6 / Cosine similarity threshold; store 128D vector in `faceEmbedding.model.js`. |
| **Liveness Detection** | Eye blink detection, head movement verification, real-time motion analysis (Sec 3.3.4, Algo 1) | Client sends naive `livenessPassed: true` boolean; backend blindly trusts boolean | Implement server-coordinated challenge protocol: nonce, action sequence (`blink`, `turnLeft`, `turnRight`), timing bounds, and landmark evidence validation. |
| **Database Entities (ER)** | `Department` (dept_id, name), `Class` (class_id, title), `Session` (session_id, status), `User` (user_id, role, email), `Attendance Record` (record_id, marked_at), `Face Embedding` (embedding_id, vector) (Fig 3.2) | Field mismatch: `Attendance` used `timestamp` instead of `markedAt`; `AttendanceUser` duplicated face embedding | Standardize on `markedAt`, enforce relational foreign keys, reconcile `FaceEmbedding` audit record and single source of truth. |
| **Verification Algorithm** | Algorithm 1: Scan QR -> Validate QR signature & timestamp -> Capture webcam frame -> Generate embedding -> Compare with stored embedding -> Liveness checks -> Mark attendance & update records (Sec 3.7) | Student controller had disconnected QR step and unverified face step | Formally implement Algorithm 1 pipeline: Step 1 (QR scan) creates short-lived `AttendanceChallenge`; Step 2 (Face + Liveness) consumes challenge atomically and writes `Attendance` record with `markedAt`. |
| **Validation Test Cases** | Table 4.1: (1) Invalid QR scan -> Rejected, (2) Valid QR + wrong face -> Rejected, (3) Valid QR + registered face -> Marked, (4) Expired session QR -> Rejected, (5) CSV export -> Downloaded | Manually testable, but missing end-to-end automated test harness | Add automated integration test suite verifying all 5 cases from Table 4.1. |

---

## 2. Hardening & Defect Repair Steps (Core System)

### Step 1: Canonical Data Contracts & Database Fixtures
- Standardize all attendance timestamp operations on `markedAt` (aligning with Report Fig 3.2 ER diagram and Algorithm 1).
- Standardize QR timestamps on Unix seconds/milliseconds with strict 30s expiration window and clock-skew/future timestamp rejection.
- Standardize API response wrapper using `ApiResponse(statusCode, data, message)` and error handling via `ApiError(statusCode, message)`.
- Configure test harness with isolated MongoDB instance and seeded fixtures for Department, Faculty, Student, Class, and Session.

### Step 2: Authentication Privilege Hardening & Cookie-Only Storage
- Restrict public `/api/auth/register` to `student` role only; admin and faculty registrations restricted to authenticated admin endpoints (`/api/admin/create-faculty`, etc.).
- Update admin password updates to invoke document `.save()` to ensure bcrypt pre-save middleware fires.
- Remove JWT access tokens from JSON response payloads and Zustand `authStore` localStorage. Use HttpOnly, Secure, SameSite cookies for both access and refresh tokens.
- Add silent token refresh on app reload via `/api/auth/refresh-token` and complete cookie clearing on `/api/auth/logout`.

### Step 3: Atomic Face Registration & Persistence
- Reconcile `AttendanceUser` and `FaceEmbedding` models: store primary 128D vector in `FaceEmbedding` with audit metadata and reference on `AttendanceUser.faceEmbeddingId`.
- Implement atomic registration using MongoDB sessions/transactions or compensating rollback: ensure image upload + embedding calculation + database write succeed or fail together.
- Update `/api/student/face/status` and `/api/admin/students` to accurately reflect `faceRegistered: Boolean` and `faceRegisteredAt: Date`.

### Step 4: Server-Side Challenge Binding (Algorithm 1 Implementation)
- In `student.controller.js` (`verifyQR`): upon validating HMAC signature and expiry, generate a short-lived `AttendanceChallenge` record containing:
  - `challengeId`, `nonce`, `studentId`, `sessionId`, `classId`
  - `expiresAt` (e.g., 60 seconds)
  - `actionSequence` (e.g., `["blink", "turnLeft", "turnRight"]`)
  - `consumed: false`
- Return `challengeId`, `nonce`, and `actionSequence` to the student client.
- In `verifyFace`: require `challengeId` and `nonce`. Atomically find and consume challenge (`findOneAndUpdate({ _id, consumed: false }, { consumed: true, consumedAt: new Date() })`).
- Reject direct face verification calls, cross-student challenge reuse, expired challenges, and duplicate attendance submissions.

### Step 5: Server-Verified Liveness Protocol
- Eliminate blind reliance on client `livenessPassed: true`.
- Update `FaceCapture.jsx` / `FaceVerification.jsx` to guide student through dynamic action sequence (`blink` -> `turnLeft` -> `turnRight`).
- Collect landmark transition metrics (Eye Aspect Ratio [EAR] drops for blink, yaw angle delta for head turns) and timestamp deltas.
- Backend validates challenge action sequence against submitted evidence within allowable duration window (2–10 seconds).
- Persist `faceVerificationDetails.livenessChecks: { blink: true, headMovement: true }` and `similarityScore` on `Attendance` record.

### Step 6: Route Validation & Rate Limiting
- Attach Zod validation middleware to all faculty, student, and admin routes.
- Validate MongoDB ObjectIds, numeric ranges for embeddings (128 floats between -1 and 1), pagination parameters, and date strings.
- Enforce class/session ownership checks: ensure faculty can only modify their own classes and sessions.
- Apply rate limiters to `/api/student/attendance/verify-qr` and `/api/student/attendance/verify-face` keyed by `userId + ip`.

### Step 7: Concurrency & Persistence Consistency
- Enforce partial unique index `{ classId: 1, isActive: 1 }` where `isActive: true` on `AttendanceSession` to prevent concurrent active sessions for the same class.
- Retain unique index `{ sessionId: 1, studentId: 1 }` on `Attendance` to guarantee zero duplicate attendance records under concurrent requests.
- Atomically calculate live session attendance count and generate faculty CSV exports matching report Section 3.3.5.

---

## 3. Future Scopes Implementation Workstreams (Chapter 5)

The B.Tech Project Report specifically identifies 7 key areas in **Section 5.3 (Future Work)** and **Section 5.3.1 (BLE-Based Proximity Verification)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SAS FUTURE WORK WORKSTREAMS                           │
├────────────────────────────────┬────────────────────────────────────────────┤
│ 1. BLE Proximity Verification  │ Hardware beacon proximity validation       │
│ 2. Mobile App & PWA Readiness  │ Mobile manifest, service worker, camera UI │
│ 3. Offline Synchronization     │ Local IndexedDB queue & signed sync API    │
│ 4. Enhanced Anti-Spoofing      │ Dynamic action engine & texture analysis   │
│ 5. Automated Notification Sys  │ Low attendance (<75%) & session alerts     │
│ 6. Trend Analytics & Insights  │ Debarment risk index & class performance   │
│ 7. Institutional ERP Sync      │ University SIS roster import/export API    │
└────────────────────────────────┴────────────────────────────────────────────┘
```

### Workstream 1: BLE-Based Proximity Verification (Report Sec 5.3.1)
- **Concept**: Faculty's laptop or mobile device broadcasts a BLE advertisement (or authorized classroom BLE beacon with dynamic session UUID). Student's browser/device uses the **Web Bluetooth API** to scan for the beacon.
- **Workflow**:
  1. Faculty starts session: backend generates a temporary `bleServiceUuid` and dynamic `bleBeaconToken` stored in `AttendanceSession`.
  2. Faculty dashboard activates Web Bluetooth advertising (or displays classroom beacon identifier).
  3. Student attendance page initiates Bluetooth device scan:
     - Connects/detects beacon within RSSI threshold (e.g., RSSI >= -75 dBm to ensure inside classroom).
     - Obtains cryptographic beacon token.
  4. Student submits `bleProof: { beaconToken, rssi, detectedAt }` along with QR scan.
  5. Backend validates BLE proof before issuing `AttendanceChallenge`.
- **Database Extension**:
  - `AttendanceSession`: add `bleEnabled: Boolean`, `bleServiceUuid: String`, `bleBeaconToken: String`, `bleRssiThreshold: Number` (default -75).
  - `Attendance`: add `bleVerified: Boolean`, `bleRssi: Number`, `bleDetectedAt: Date`.

### Workstream 2: Progressive Web Application (PWA) & Mobile Optimization (Report Sec 5.3)
- Add Web App Manifest (`manifest.webmanifest`) with standalone display mode, orientation locks, camera permissions, and offline fallback icon assets.
- Configure Service Worker for static asset caching, offline fallback pages, and instant loading on campus Wi-Fi.
- Optimize camera capture pipeline for mobile viewport aspect ratios (front camera selection via `facingMode: 'user'`).

### Workstream 3: Offline Synchronization & Resilient Attendance (Report Sec 5.3)
- In scenarios with intermittent campus Wi-Fi / dead zones in lecture halls:
  - Cache active session credentials and face embeddings locally in encrypted browser `IndexedDB`.
  - When offline, client captures photo, records face landmarks + challenge nonce, and stores an encrypted attendance attempt record locally.
  - When connection re-establishes, background sync worker submits to `/api/student/attendance/sync-offline`.
  - Backend verifies timestamp bounds, challenge signatures, and records attendance with `syncStatus: 'synced_from_offline'`.

### Workstream 4: Enhanced Anti-Spoofing & Active Liveness Engine (Report Sec 5.3)
- Expand the basic blink/head-turn check into a randomized multi-challenge state machine:
  - Random choice from: `['blink', 'smile', 'look_left', 'look_right', 'nod_head']`.
  - Frequency / timing variance check to defeat pre-recorded video loops and digital screen replays.
  - Dynamic screen flash color reflection (screen pulses a color like cyan/amber; camera verifies facial color hue shift).

### Workstream 5: Automated Notifications & Alert Engine (Report Sec 5.3)
- Automated email & in-app alerts triggered via background scheduler / cron:
  - **75% Attendance Warning**: Automatic notification sent to student and faculty advisor when student attendance drops below 75% statutory requirement (risk of debarment).
  - **Session Started Alert**: Push/email notice to enrolled students when faculty launches a new attendance session.
  - **Absence Summary**: Weekly email recap of attended vs missed lectures.

### Workstream 6: Attendance Trend Analytics & Visual Intelligence (Report Sec 5.3)
- Aggregate pipeline in `faculty.controller.js` and `admin.controller.js`:
  - Attendance rate trends by day of week, hour of day, and class topic.
  - Student risk matrix: categorization into *Safe (>85%)*, *Warning (75-85%)*, and *Critical (<75%)*.
  - Department-wide analytics: comparison of student turnout across faculty courses.
  - Interactive charts on Faculty and Admin dashboards using Chart.js or Recharts.

### Workstream 7: Institutional ERP & SIS Integration (Report Sec 5.3)
- RESTful standard export/import endpoints:
  - `POST /api/admin/erp/sync-students`: Bulk student enrollment import via CSV/JSON with automatic validation.
  - `GET /api/faculty/classes/:id/erp-export`: Standardized academic ERP export format (compatible with Moodle, Canvas, Blackboard, and university MIS).
  - Webhook triggers on session completion to notify external LMS.

---

## 4. Phased Execution Roadmap

### Phase 1: Core System Hardening & Thesis Tally (Immediate)
- Fix auth cookies, remove token JSON leaks, restrict registration.
- Fix atomic face registration and single source of truth for embeddings.
- Implement server-side `AttendanceChallenge` linking QR scan to face verification.
- Enforce `markedAt` across models, controllers, reports, and UI.
- Verify 5/5 functional test cases from Report Table 4.1.

### Phase 2: BLE Proximity & Mobile PWA Foundation
- Implement BLE session configuration on backend and Web Bluetooth scanning in student verification flow.
- Add PWA manifest, service worker, and mobile-optimized camera UI.

### Phase 3: Analytics, Notifications & ERP Integration
- Build automated 75% threshold warning notifications.
- Implement attendance trend aggregation endpoints and dashboard charts.
- Implement ERP CSV/JSON import-export workflows for campus-wide deployment.

---

## 5. Verification & Acceptance Criteria
1. **Report Table 4.1 Functional Test Suite**:
   - `TC-01`: Invalid QR payload -> returns 400 Bad Request.
   - `TC-02`: Valid QR with wrong face embedding -> returns 400 Face verification failed.
   - `TC-03`: Valid QR with registered face embedding and valid challenge -> returns 200 Attendance marked.
   - `TC-04`: Expired session QR (> 30s) -> returns 400 QR expired.
   - `TC-05`: CSV export from faculty panel -> downloads sanitized, accurate CSV with `markedAt` and student details.
2. **Security Integrity**:
   - Zero tokens accessible in `localStorage` or `sessionStorage`.
   - Replay/reuse of challenge token rejected with 400.
   - Duplicate attendance submission blocked by unique DB index.
3. **Future Scopes Readiness**:
   - BLE session data contracts in place; graceful fallback if client lacks Web Bluetooth.
   - Low-attendance alerts and analytics reporting endpoints functional.
