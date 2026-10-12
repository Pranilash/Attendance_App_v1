# Smart Attendance System

The Smart Attendance System manages student attendance with rotating QR codes, facial verification, and Bluetooth proximity checks.

## Architecture Diagram

View the interactive system architecture diagram in [smart-attendance-architecture.html](file:///c:/Users/Dell/Desktop/VS%20Code/Development/Attendance%20App/smart-attendance-architecture.html) or open `/architecture-diagram.html` in your web browser.

## Features

- **Role Access Control**: The system provides separate portals for administrators, faculty members, and students.
- **Rotating QR Codes**: Faculty sessions display HMAC-signed QR codes that refresh every 14 seconds.
- **Facial Verification**: The system matches student webcam embeddings against registered 128-dimensional biometric vectors. The cosine similarity threshold is 0.60.
- **Dynamic Liveness**: The system verifies eye blinks and head yaw angles to reject photo spoofing.
- **Bluetooth Proximity**: The mobile client verifies proximity using classroom Bluetooth Low Energy beacon RSSI levels.
- **Debarment Risk Index**: The analytics engine calculates student debarment risk and updates the faculty watchlist.
- **Timetable Synchronization**: The scheduler links class attendance windows to weekly timetable slots.

## Technical Specifications

| Component | Technology | Description |
|---|---|---|
| **Frontend Client** | React 18, Vite, Tailwind CSS | Progressive Web App with offline model caching |
| **Backend Server** | Node.js, Express.js | REST API with JWT access and refresh cookies |
| **Primary Database** | MongoDB Atlas M0 | Document store for users, classes, and logs |
| **In-Memory Cache** | Upstash Redis | Ephemeral store for active session tokens |
| **Biometric Storage** | Cloudinary CDN | Encrypted cloud storage for reference face images |

## Security Controls

- JWT authentication with HTTP-only cookies and role verification.
- HMAC-SHA256 signature verification on 14-second rotating QR payloads.
- Rate limiters on authentication and verification endpoints.
- Zod schema validation on all request bodies.
- Helmet security headers and strict CORS origin verification.

## Directory Structure

```
Attendance App/
├── docs/                              # Project documentation and module guides
├── frontend/                          # React 18 Progressive Web App
│   ├── public/architecture-diagram.html # Interactive architecture diagram
│   └── src/                           # Components, pages, and state store
├── professional-backend-structure-main/ # Express backend
│   └── src/                           # Controllers, models, routes, and utils
├── smart-attendance-architecture.html # Standalone architecture diagram
└── docker-compose.yml                 # Multi-container orchestration
```

## Documentation Index

Read the focused documentation files in the `docs/` directory:

- [Backend Specification](docs/README-BACKEND-ATTENDANCE.md): Service architecture and API contracts.
- [Backend API Guide](docs/README-BACKEND.md): Route tables and environment variables.
- [Frontend Client Guide](docs/README-FRONTEND.md): PWA setup, biometric capture, and state store.
- [Deployment Guide](docs/DEPLOYMENT.md): Production deployment and cloud hosting procedures.
- [Deployment Checklist](docs/DEPLOYMENT_READY.md): Pre-flight configuration and security checklist.
- [Bug Audit](docs/BUG_AUDIT.md): Complete analysis of resolved race conditions and defects.
- [Capstone Upgrades](docs/VII_SEM_PROPOSED_UPGRADES.md): Engineering specifications for VII semester features.

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas cluster or local MongoDB instance

### 1. Configure the Backend Environment

Create `professional-backend-structure-main/.env` with these values:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/attendance_system
ACCESS_TOKEN_SECRET=your-access-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
QR_SECRET=your-qr-hmac-secret-min-32-chars
```

### 2. Install Dependencies

Run this command in the backend directory:

```bash
cd professional-backend-structure-main
npm install
```

Run this command in the frontend directory:

```bash
cd ../frontend
npm install
```

### 3. Seed Database Records

Run the seed script to create initial departments, faculty, and student accounts:

```bash
cd professional-backend-structure-main
npm run seed
```

### 4. Start the Application

Start the backend server on port 8000:

```bash
cd professional-backend-structure-main
npm run dev
```

Start the frontend development server on port 5173:

```bash
cd ../frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Default Credentials

| Role | Email Address | Password |
|---|---|---|
| Admin | `admin@attendance.edu` | `Admin@123456` |
| Faculty | `priya.sharma@attendance.edu` | `Faculty@123` |
| Student | `arjun.reddy@attendance.edu` | `Student@123` |

## Operational Workflow

1. The administrator logs in to configure departments, courses, and user accounts.
2. The student registers their face embedding through the webcam.
3. The faculty member starts a class session. The portal displays rotating QR codes.
4. The student scans the QR code.
5. The student completes dynamic liveness checks and facial verification.
6. The system marks attendance and updates the class ledger.
7. The faculty member inspects real-time counts and downloads CSV attendance reports.

## Core API Endpoints

| Method and Route | Access Level | Description |
|---|---|---|
| `POST /api/auth/login` | Public | Authenticate user and issue tokens |
| `GET /api/admin/stats` | Admin | Return system dashboard statistics |
| `POST /api/faculty/session/start` | Faculty | Create a new attendance session |
| `POST /api/faculty/session/end` | Faculty | Close an active attendance session |
| `GET /api/faculty/class/:id/debarment-watchlist` | Faculty | Return students below 75 percent attendance |
| `POST /api/student/face/register` | Student | Store 128-dimensional face embedding |
| `POST /api/student/attendance/verify-qr` | Student | Check rotating QR token and timestamp |
| `POST /api/student/attendance/verify-face` | Student | Match face vector and record attendance |

## License

ISC
