# Smart Attendance System Backend Specification

This document defines the architecture, configuration, and API specifications for the Smart Attendance System backend service.

## Architecture Overview

The backend uses Node.js and Express. MongoDB Atlas stores user, course, and attendance data. Redis caches rotating tokens and session data.

See the system architecture diagram in [smart-attendance-architecture.html](file:///c:/Users/Dell/Desktop/VS%20Code/Development/Attendance%20App/smart-attendance-architecture.html).

## Core Verification Pipeline

The attendance verification flow uses three sequential gates:

1. **HMAC Rotating QR Code**: The faculty dashboard generates a signed QR code every 14 seconds. The student scans the code before the time window expires.
2. **Dynamic Liveness**: The system prompts the student for real-time actions. The client evaluates eye blinks with Eye Aspect Ratio (EAR) delta and head yaw angles.
3. **Biometric Face Verification**: The client extracts a 128-dimensional facial embedding vector. The server calculates the cosine similarity against the registered vector. The match threshold is 0.60.
4. **Bluetooth Low Energy Proximity**: The client detects classroom beacon signals and validates that the RSSI exceeds the room threshold.

## Directory Layout

```
professional-backend-structure-main/
├── src/
│   ├── controllers/         # Request handlers for auth, admin, faculty, and student
│   ├── middlewares/         # JWT verification, RBAC, and rate limiters
│   ├── models/              # Mongoose data models
│   ├── routes/              # Express API route declarations
│   ├── utils/               # QR cryptography, face similarity, and response helpers
│   ├── validators/          # Zod input schemas
│   ├── app-attendance.js    # Express application setup
│   └── index-attendance.js  # Server entry point
├── package.json
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

Run this command in the backend directory:

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env` using this configuration:

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/attendance_system
ACCESS_TOKEN_SECRET=your-access-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
QR_SECRET=your-qr-hmac-secret-min-32-chars
QR_REFRESH_INTERVAL=14
FACE_SIMILARITY_THRESHOLD=0.60
```

### 3. Seed Initial Database Records

```bash
npm run seed
```

### 4. Start the Development Server

```bash
npm run dev
```

The backend server listens on port 8000.

## API Endpoint Reference

### Authentication Endpoints

```
POST /api/auth/register/student   - Register student account
POST /api/auth/register/faculty   - Register faculty account
POST /api/auth/login              - Authenticate user credentials
POST /api/auth/refresh-token      - Issue new access token
POST /api/auth/logout             - Clear user authentication cookies
GET  /api/auth/me                 - Return profile of current user
```

### Administrator Endpoints

```
GET  /api/admin/stats             - Return system dashboard statistics
GET  /api/admin/departments       - List all departments
POST /api/admin/departments       - Create a new department
GET  /api/admin/faculty           - List registered faculty members
GET  /api/admin/students          - List registered students
```

### Faculty Endpoints

```
GET  /api/faculty/classes                  - List classes taught by faculty member
POST /api/faculty/classes                  - Create a new class
POST /api/faculty/session/start            - Start an attendance session
POST /api/faculty/session/end              - Stop an active attendance session
GET  /api/faculty/report/class/:id         - Generate attendance report for class
GET  /api/faculty/class/:id/debarment-watchlist - Return students with attendance below 75 percent
GET  /api/faculty/timetable                - Return scheduled classes for faculty member
```

### Student Endpoints

```
POST /api/student/face/register            - Register 128-dimensional face embedding
GET  /api/student/face/status              - Return face registration status
POST /api/student/attendance/verify-qr     - Validate rotating QR code token
POST /api/student/attendance/verify-face   - Match face vector and record attendance
GET  /api/student/attendance/history       - Return personal attendance records
GET  /api/student/timetable                - Return scheduled weekly class slots
```

## Security Controls

| Threat Vector | Mitigation Control |
|---|---|
| QR Code Screenshot | 14-second expiration window |
| Credential Interception | HTTP-only cookies with JWT token rotation |
| Replay Attacks | HMAC-SHA256 signature verification |
| Photo Spoofing | Dynamic EAR blink and head yaw validation |
| Proxy Attendance | Algorithm 1 multi-factor verification pipeline |
| Unauthorized Access | Role-based route middleware |

## Automated Test Verification

Run the test suite to execute the Algorithm 1 verification matrix:

```bash
npm test
```

## License

ISC