# Smart Attendance System (SAS)

A secure attendance management system using **QR codes** and **face verification** to prevent proxy attendance. Built with the MERN stack.

## Features

- **Role-based access** — Admin, Faculty, and Student dashboards
- **QR-based attendance** — Faculty generates rotating QR codes (14s refresh, HMAC-signed); students scan to initiate attendance
- **Face verification** — Students register their face via webcam; attendance requires real-time face matching (face-api.js, 128-dim embeddings, cosine similarity ≥ 0.6)
- **Liveness detection** — Blink/head movement checks to prevent photo spoofing
- **Admin panel** — Manage departments, faculty, students; view system-wide stats
- **Faculty panel** — Create classes, start/end sessions, live attendance count, reports, CSV export
- **Student panel** — Scan QR, face registration, attendance history, attendance progress

## Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, Axios, react-router-dom, face-api.js, html5-qrcode |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), JWT (access + refresh tokens in cookies) |
| **Security** | Helmet, CORS, rate limiting, HMAC-signed QR codes, bcrypt, Zod validation |

## Project Structure

```
├── frontend/                  # React + Vite frontend
│   └── src/
│       ├── components/        # Reusable components (FaceCapture, QRScanner, layouts)
│       ├── pages/             # Route pages (admin/, faculty/, student/, auth/)
│       ├── services/api.js    # Axios API client
│       └── store/authStore.js # Zustand auth state
├── professional-backend-structure-main/   # Express.js backend
│   └── src/
│       ├── controllers/       # Route handlers
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express routers
│       ├── middlewares/       # Auth, RBAC, security
│       ├── validators/        # Zod schemas
│       ├── utils/             # ApiError, ApiResponse, asyncHandler, face verification
│       └── scripts/           # seed.js, check-face.js
└── docker-compose.yml         # Optional Docker setup
```

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Configure environment

Create `professional-backend-structure-main/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

### 2. Install dependencies

```bash
cd professional-backend-structure-main && npm install
cd ../frontend && npm install
```

### 3. Seed the database

```bash
cd professional-backend-structure-main
npm run seed
```

### 4. Start both servers

```bash
# Terminal 1 — Backend (port 5000)
cd professional-backend-structure-main
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000**

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@attendance.edu` | `Admin@123456` |
| Faculty | `priya.sharma@attendance.edu` | `Faculty@123` |
| Student | `arjun.reddy@attendance.edu` | `Student@123` |

## Demo Flow

1. **Admin** → Login → View dashboard, manage departments/faculty/students
2. **Faculty** → Login → Go to Session Control → Start session → QR code appears (auto-refreshes)
3. **Student** → Login → Register Face → Scan QR → Face Verification → Attendance marked ✅
4. **Faculty** → See live attendance count → End session → View reports / export CSV

## API Endpoints

| Route | Description | Auth |
|---|---|---|
| `POST /api/auth/login` | Login | Public |
| `POST /api/auth/register/student` | Register student | Public |
| `POST /api/auth/register/faculty` | Register faculty | Public |
| `GET /api/admin/stats` | Dashboard stats | Admin |
| `GET /api/admin/faculty` | List faculty | Admin |
| `GET /api/admin/students` | List students | Admin |
| `POST /api/faculty/classes` | Create class | Faculty |
| `POST /api/faculty/session/start` | Start attendance session | Faculty |
| `POST /api/faculty/session/end` | End session | Faculty |
| `GET /api/faculty/report/class/:id` | Class attendance report | Faculty |
| `POST /api/student/face/register` | Register face embedding | Student |
| `POST /api/student/attendance/verify-qr` | Verify QR code | Student |
| `POST /api/student/attendance/verify-face` | Verify face & mark attendance | Student |

## License

ISC
