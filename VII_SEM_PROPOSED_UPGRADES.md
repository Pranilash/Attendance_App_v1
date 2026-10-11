# Smart Attendance System (SAS) — VII Semester Major Project Specification & Architectural Roadmap

**Academic Year:** 2026–2027  
**Department:** Computer Science & Engineering  
**Project Track:** Capstone Major Project (VII & VIII Semester)  
**Foundation Base:** B.Tech VI Sem Mini-Project (MERN + Dual-Factor Dynamic QR & Biometric Face Verification)

---

## 1. Executive Summary & Problem Context

In the **VI Semester**, the Smart Attendance System established a working 3-tier prototype comprising:
1. Dynamic rotating HMAC-SHA256 QR codes (14s rotation, 30s server window).
2. Client-side 128-dimensional facial embedding generation via `@vladmandic/face-api`.
3. Euclidean & Cosine similarity matching (threshold $\le 0.6$) against enrolled templates.
4. Role-based administration (Admin, Faculty, Student) with session control and CSV reporting.
5. Server challenge binding (Algorithm 1) to prevent double-marking and replay attacks.

### The Remaining Vulnerabilities & Next-Stage Scope:
Despite the dual-factor security, real-world deployment in a university environment introduces five distinct challenges:
1. **Remote Proxy via Screen Sharing:** A proxy student sitting in class can live-stream or photograph the dynamic QR code to an absent peer over WhatsApp or Discord. The absent peer can scan and match their face from home.
2. **Browser-Constrained User Experience:** Relying on standard mobile web browsers creates friction: address bars take up screen space, cameras trigger repeated permission prompts, and downloading neural network weights over spotty classroom 4G causes timeouts.
3. **Client-Trusted Liveness:** The current anti-spoofing mechanism relies on the client signaling `livenessPassed: true`. Advanced adversaries can intercept and replay HTTP payloads.
4. **Reactive Attendance Management:** Attendance percentages are calculated retroactively. Students and advisors discover debarment status ($<75\%$) only after the cutoff date has passed.
5. **Manual Operational Overhead:** Instructors must manually log in, navigate menus, select sections, and trigger session starts for every lecture.

To address these gaps, the **VII Semester Major Project** implements **five strategic engineering upgrades** built directly on top of the established VI Sem codebase.

---

## 2. Architectural Blueprint: The 5 Proposed Upgrades

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        VII SEMESTER CAPSTONE ARCHITECTURE                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [1. PWA Engine]           [2. Proximity Guard]           [3. Biometric Hardening]     │
│  • Service Worker Cache    • Web Bluetooth / BLE Beacon   • Server Landmark Challenge  │
│  • Standalone Fullscreen   • RSSI Threshold (≥ -75 dBm)   • EAR Blink & Yaw Dynamics   │
│  • Offline Model Weights   • Dynamic Beacon Rolling Token • Anti-Replay Nonce Engine   │
│                                                                                        │
│                                 ▲                                                      │
│                                 │ REST API & WebSockets                                │
│                                 ▼                                                      │
│                                                                                        │
│  [4. Predictive Analytics] ◀───┼───▶ [5. Academic ERP & Timetable Engine]              │
│  • Debarment Risk Index (DRI)  │     • Auto-Scheduled Classroom Sessions               │
│  • Trend & Absenteism Forecast │     • Timetable Collision Matrix                      │
│  • Automated Cutoff Alerts     │     • Roster & Attendance Sync                        │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep-Dive Specification of Proposed Upgrades

### Upgrade 1: Progressive Web App (PWA) with Offline Model Pre-Caching

#### Motivation:
Facial detection neural network weights (`@vladmandic/face-api`) exceed 6MB. Re-fetching these assets over congested campus Wi-Fi causes loading freezes during lecture roll-call. Furthermore, standard mobile browser viewports clip video canvases.

#### Architectural Design:
* Integrate `vite-plugin-pwa` (Workbox) into the existing Vite build pipeline.
* Configure a Web App Manifest specifying `display: standalone`, mobile orientations, and brand colors.
* Implement a runtime caching strategy that precaches the application shell and persists neural network weight shards in browser `CacheStorage`.

#### Implementation Plan:
1. **Tooling & Plugins:** Add `vite-plugin-pwa` to `frontend/package.json`.
2. **Configuration (`frontend/vite.config.js`):**
   * Register auto-updating Service Worker (`registerType: 'autoUpdate'`).
   * Define asset precache manifests for all CSS, JS bundles, and static SVG/PNG icons.
   * Add Workbox runtime caching rule for `@vladmandic/face-api` CDN weight files with a `CacheFirst` strategy (30-day expiration).
3. **App Manifest & Identity:**
   * Generate standard PNG icons: `pwa-192x192.png` and `pwa-512x512.png`.
   * Configure `manifest.webmanifest` with theme colors matching the institutional palette (`#1f2937`).
4. **Installation UX:**
   * Add an install banner prompt on the Student and Faculty login dashboards for one-tap home screen installation.

---

### Upgrade 2: Bluetooth Low Energy (BLE) Hardware Proximity Verification

#### Motivation:
Eliminates the "remote screen-sharing" attack vector where absent students scan a QR code forwarded digitally. Proximity verification enforces physical presence inside the lecture hall.

#### Architectural Design:
* **Faculty/Room Transmitter:** The instructor's laptop (via Web Bluetooth Peripheral or classroom ESP32 beacon) advertises a Bluetooth Low Energy service UUID containing a cryptographically rotating ephemeral session token.
* **Student Receiver:** Upon scanning the QR code, the student's PWA invokes the **Web Bluetooth API** (`navigator.bluetooth`) to scan for the room's BLE service UUID.
* **RSSI Filtering:** The student device must record a Received Signal Strength Indicator (RSSI) of $\ge -75\text{ dBm}$ (typically corresponding to within $5\text{--}8\text{ meters}$ inside standard classroom dimensions).
* **Cryptographic Proof Submission:** The student sends `{ beaconToken, rssi, detectedAt }` alongside the QR scan to the backend. The backend validates token validity before releasing the facial recognition challenge.

#### Data Model & API Modifications:
* **Model Update (`AttendanceSession`):**
  ```javascript
  bleServiceUuid: { type: String, default: null },
  bleBeaconSecret: { type: String, select: false },
  bleTokenTimestamp: { type: Date }
  ```
* **Endpoint (`POST /api/student/attendance/verify-qr`):**
  * Accepts `bleProof` in request body.
  * Rejects verification if BLE token is missing, expired, or invalid.

---

### Upgrade 3: Server-Verified Dynamic Liveness & Anti-Spoofing Protocol

#### Motivation:
The VI Sem implementation performed basic eye-blink detection on the client side and transmitted a static boolean `livenessPassed: true`. This vulnerable contract can be bypassed using modified client code or automated API calls.

#### Architectural Design:
* Transition to a **Server-Coordinated Challenge-Response Protocol**:
  1. During Step 1 (QR scan), the server generates a randomized prompt challenge:
     $$\text{ActionSequence} = [\text{action}_1, \text{action}_2] \quad \text{where } \text{action} \in \{\text{'blink'}, \text{'yawLeft'}, \text{'yawRight'}, \text{'smile'}\}$$
  2. The server binds this sequence to a 60-second `AttendanceChallenge` nonce.
  3. The client captures frame-by-frame 68-point facial landmarks during the interaction.
  4. The client computes timestamped mathematical transition deltas:
     * **Eye Aspect Ratio (EAR):**
       $$\text{EAR} = \frac{||\mathbf{p}_2 - \mathbf{p}_6|| + ||\mathbf{p}_3 - \mathbf{p}_5||}{2 ||\mathbf{p}_1 - \mathbf{p}_4||}$$
     * **Head Yaw Ratio (HYR):** Relative distance between nose tip ($\mathbf{p}_{31}$) and outer jaw contours ($\mathbf{p}_1, \mathbf{p}_{17}$).
  5. The client submits the transition vectors to the server.
  6. The server validates that the landmark changes match the requested sequence within expected temporal windows (e.g., $1.5\text{s} \le \Delta t \le 4.0\text{s}$) before approving the attendance transaction.

---

### Upgrade 4: Predictive Debarment Analytics & Early-Warning Engine

#### Motivation:
Traditional attendance portals simply display historical percentages. By the time a student reaches $74\%$, it is often mathematically impossible to recover before the semester concludes.

#### Architectural Design:
* Implement an analytical forecasting engine that evaluates attendance momentum and debarment risk:
  * **Remaining Sessions Calculation:**
    $$N_{\text{remaining}} = N_{\text{total\_planned}} - N_{\text{conducted}}$$
  * **Maximum Achievable Percentage:**
    $$\text{MaxAttendance}\% = \frac{N_{\text{attended}} + N_{\text{remaining}}}{N_{\text{total\_planned}}} \times 100$$
  * **Minimum Required Attendance to Clear Cutoff ($75\%$):**
    $$N_{\text{required}} = \max\left(0, \left\lceil 0.75 \times N_{\text{total\_planned}} \right\rceil - N_{\text{attended}}\right)$$
  * **Debarment Risk Index (DRI):**
    $$\text{DRI} = \begin{cases} 
      100\% & \text{if } \text{MaxAttendance}\% < 75\% \quad (\text{Mathematically Debarred}) \\
      \frac{N_{\text{required}}}{N_{\text{remaining}}} \times 100 & \text{if } N_{\text{remaining}} > 0 \\
      0\% & \text{otherwise}
    \end{cases}$$
* **System Integration:**
  * Embed a "Debarment Risk Radar" card directly on the Student Dashboard.
  * Add a "Class Debarment Watchlist" for faculty members to identify at-risk students weeks before final examinations.

---

### Upgrade 5: Automated Timetable Engine & Academic Schedule Synchronization

#### Motivation:
Manual session initiation by instructors introduces latency at the beginning of lectures and leads to forgotten sessions or inaccurate start timestamps.

#### Architectural Design:
* Introduce a structured **Timetable Entity** that links courses, faculty, lecture rooms, weekday recurrence, and time slots.
* **Background Scheduler:** An automated cron engine running via `node-cron` checks the active schedule every minute.
* **Workflow:**
  1. 5 minutes before scheduled start time: System auto-initializes the `AttendanceSession` in `ready` state.
  2. When instructor opens the app: Session is already live with active dynamic QR code pre-rendered.
  3. At scheduled end time + grace period (e.g., +10 minutes): System auto-closes the session, tallies absentees, and locks records.

#### Data Model (`TimetableSchedule`):
```javascript
{
  classId: { type: ObjectId, ref: 'Class', required: true },
  facultyId: { type: ObjectId, ref: 'AttendanceUser', required: true },
  roomNumber: { type: String, required: true },
  dayOfWeek: { type: Number, enum: [1, 2, 3, 4, 5, 6] }, // Mon-Sat
  startTime: { type: String, required: true }, // "10:00"
  endTime: { type: String, required: true },   // "11:00"
  autoStart: { type: Boolean, default: true },
  autoEnd: { type: Boolean, default: true }
}
```

---

## 4. Work Breakdown & Implementation Phasing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IMPLEMENTATION ROADMAP                             │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ Phase 1      │ Progressive Web App (PWA) Foundation & Offline Asset Caching │
│ Phase 2      │ Predictive Attendance Analytics & Debarment Risk Index (DRI) │
│ Phase 3      │ Server-Verified Landmark Anti-Spoofing Challenge Pipeline    │
│ Phase 4      │ BLE Proximity Verification & Web Bluetooth Integration      │
│ Phase 5      │ Automated Timetable Scheduling & Institutional Roster Engine │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 5. Summary of Deliverables & Academic Merit

| Dimension | VI Semester Baseline | VII Semester Upgrade Target |
|---|---|---|
| **Platform** | Responsive Web Browser Application | Installable Offline-Capable PWA |
| **Physical Security** | Virtual (HMAC Dynamic QR) | Dual-Layer Physical (HMAC QR + BLE Proximity) |
| **Anti-Spoofing** | Naive client-side boolean flag | Server-validated dynamic landmark transitions |
| **Data Intelligence** | Static attendance percentage tally | Predictive Debarment Risk Index & Forecasts |
| **Operations** | 100% manual session lifecycle | Automated timetable-driven session lifecycle |

This roadmap preserves the integrity of the established VI Sem code while directly expanding the system into a robust, publication-ready engineering capstone.
