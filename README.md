# Smart Attendance System

The Smart Attendance System manages student attendance with rotating QR codes, facial verification, and Bluetooth proximity verification.

The production web application runs live at:
**[https://attendanceappv1.vercel.app](https://attendanceappv1.vercel.app)**

## Architecture Diagram

View the interactive system architecture diagram in [smart-attendance-architecture.html](file:///c:/Users/Dell/Desktop/VS%20Code/Development/Attendance%20App/smart-attendance-architecture.html). You can also open `/architecture-diagram.html` in your web browser.

## Features

- **Role Access Control**: The system provides separate portals for administrators, faculty members, and students.
- **Rotating QR Codes**: Faculty sessions display HMAC-signed QR codes that refresh every 14 seconds.
- **Facial Verification**: The system matches webcam face embeddings against registered 128-dimensional vectors. The similarity threshold is 0.60.
- **Dynamic Liveness**: The system verifies eye blinks and head yaw angles to reject photo spoofing.
- **Bluetooth Proximity**: The mobile client verifies proximity using classroom Bluetooth beacon signal strength.
- **Debarment Risk Index**: The analytics engine calculates student debarment risk and updates the faculty watchlist.
- **Timetable Synchronization**: The scheduler links class attendance windows to weekly timetable slots.

## Technical Specifications

| Component | Technology | Description |
|---|---|---|
| **Frontend Client** | React 18, Vite, Tailwind CSS | Progressive Web App with offline model caching |
| **Backend Server** | Node.js, Express.js | Serverless REST API on Vercel |
| **Primary Database** | MongoDB Atlas M0 | Cloud document store for users, classes, and logs |
| **Biometric Engine** | @vladmandic/face-api | Client-side 128-dimensional facial embeddings |
| **Deployment** | Vercel Monorepo | Unified frontend and serverless backend deployment |

## Production Deployment

The application runs on Vercel as a unified full-stack monorepo:

- **Live URL**: `https://attendanceappv1.vercel.app`
- **Database**: MongoDB Atlas M0 Cloud Cluster
- **API Base Path**: `https://attendanceappv1.vercel.app/api`
- **Health Endpoint**: `https://attendanceappv1.vercel.app/health`

## Security Controls

- JWT authentication with HTTP-only cookies and role verification.
- HMAC-SHA256 signature verification on 14-second rotating QR payloads.
- Rate limiters on authentication and verification endpoints.
- Zod schema validation on all request bodies.
- Helmet security headers and strict CORS origin verification.

## Directory Structure

```
Attendance App/
├── api/                               # Vercel serverless function entry point
├── docs/                              # Project documentation and module guides
├── frontend/                          # React 18 Progressive Web App
│   ├── public/architecture-diagram.html # Interactive architecture diagram
│   └── src/                           # Components, pages, and state store
├── professional-backend-structure-main/ # Express backend
│   └── src/                           # Controllers, models, routes, and scripts
├── smart-attendance-architecture.html # Standalone architecture diagram
├── vercel.json                        # Vercel deployment and routing configuration
└── package.json                       # Monorepo workspaces definition
```

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas cloud cluster or local MongoDB instance

### 1. Configure the Backend Environment

Create `professional-backend-structure-main/.env` with these keys:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.cvaqpdd.mongodb.net/test?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=your-access-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173,https://attendanceappv1.vercel.app
QR_SECRET=your-qr-hmac-secret-min-32-chars
```

### 2. Install Dependencies

Run this command from the root directory:

```bash
npm install
```

### 3. Seed Database Records

Run the seed script to populate departments, faculty, and student records:

```bash
npm run seed
```

### 4. Start Local Development

Start the backend server on port 8000:

```bash
npm run dev:backend
```

Start the frontend development server on port 5173:

```bash
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

## Verified Test Credentials

| Role | Email Address | Password | Face Status |
|---|---|---|---|
| Admin | `admin@attendance.edu` | `Admin@123456` | Not required |
| Faculty | `priya.sharma@attendance.edu` | `Faculty@123` | Not required |
| Student | `arjun.reddy@attendance.edu` | `Student@123` | Registered (128-dim) |

## Automated Verification Suite

Run the end-to-end regression test script against the production deployment:

```bash
node professional-backend-structure-main/src/scripts/testAllEndpointsLive.js
```

This script tests 40 endpoints across authentication, administration, faculty sessions, and student attendance.

## Core API Endpoints

| Method and Route | Access Level | Description |
|---|---|---|
| `GET /health` | Public | Return server health status |
| `POST /api/auth/login` | Public | Authenticate user and issue tokens |
| `GET /api/admin/stats` | Admin | Return system dashboard statistics |
| `POST /api/faculty/session/start` | Faculty | Create a new attendance session |
| `POST /api/faculty/session/end` | Faculty | Close an active attendance session |
| `GET /api/faculty/class/:id/debarment-watchlist` | Faculty | Return students below 75 percent attendance |
| `POST /api/student/attendance/verify-qr` | Student | Verify rotating QR token and timestamp |
| `POST /api/student/attendance/verify-face` | Student | Match face vector and record attendance |
| `GET /api/student/face/status` | Student | Return face registration status |

## License

ISC
