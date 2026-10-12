# Smart Attendance System Backend API

This service provides authentication, session management, biometric verification, and attendance analytics for the Smart Attendance System.

## Architecture

The backend operates on Node.js and Express. It uses MongoDB for data persistence and Redis for in-memory session tokens.

See the system architecture diagram in [smart-attendance-architecture.html](file:///c:/Users/Dell/Desktop/VS%20Code/Development/Attendance%20App/smart-attendance-architecture.html).

## Core Capabilities

- **Authentication**: JWT token pairs in HTTP-only cookies with role authorization for Admin, Faculty, and Student.
- **Rotating QR Engine**: Generates 14-second rotating tokens signed with HMAC-SHA256 to stop screen sharing.
- **Facial Verification**: Evaluates 128-dimensional face embedding vectors with cosine similarity matching threshold 0.60.
- **Dynamic Liveness**: Evaluates Eye Aspect Ratio (EAR) delta blinks and head yaw angle changes.
- **Bluetooth Proximity**: Validates Bluetooth Low Energy beacon signals against classroom RSSI thresholds.
- **Debarment Analytics**: Calculates student Debarment Risk Index (DRI) based on minimum 75 percent attendance requirements.
- **Timetable Sync**: Coordinates attendance sessions with scheduled class timetable slots.

## Directory Structure

```
src/
├── controllers/       # Request handlers for auth, admin, faculty, and student
├── middlewares/       # JWT auth, role access control, security headers, and rate limits
├── models/            # Mongoose schemas for users, classes, sessions, attendance, and timetables
├── routes/            # Express route definitions
├── utils/             # QR generation, facial comparison, async wrapper, and API response helpers
├── validators/        # Zod request validation schemas
├── app-attendance.js  # Express application configuration
└── index-attendance.js# Server entry point
```

## Setup Instructions

### 1. Configure Environment

Create `.env` in this directory:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/attendance_system
ACCESS_TOKEN_SECRET=your-access-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
QR_SECRET=your-qr-hmac-secret-min-32-chars
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Seed Initial Records

```bash
npm run seed
```

### 4. Start Server

```bash
npm run dev
```

The server listens on port 8000.

### 5. Run Test Suite

```bash
npm test
```

## API Route Summary

| Method | Endpoint | Authorization | Function |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user credentials |
| `POST` | `/api/auth/refresh-token` | Public | Issue new access token |
| `POST` | `/api/auth/logout` | Authenticated | Clear session tokens |
| `GET` | `/api/admin/stats` | Admin | Fetch system statistics |
| `POST` | `/api/faculty/session/start` | Faculty | Open attendance session |
| `POST` | `/api/faculty/session/end` | Faculty | Close attendance session |
| `GET` | `/api/faculty/class/:id/debarment-watchlist` | Faculty | Return debarment watchlist |
| `POST` | `/api/student/face/register` | Student | Save reference face vector |
| `POST` | `/api/student/attendance/verify-qr` | Student | Validate rotating QR token |
| `POST` | `/api/student/attendance/verify-face` | Student | Validate face and record attendance |

## License

ISC
