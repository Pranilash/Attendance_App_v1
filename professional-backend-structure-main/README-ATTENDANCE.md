# Secure Smart Attendance System

A production-ready, secure web-based attendance system that prevents proxy attendance through rotating QR codes and face verification with liveness detection.

## Features

- **Rotating QR Codes**: 15-second expiry with HMAC signing to prevent screenshot sharing
- **Face Verification**: 128-dimensional face embedding comparison with cosine similarity
- **Liveness Detection**: Blink and head movement detection to prevent photo spoofing
- **Role-Based Access Control**: Admin, Faculty, and Student roles with granular permissions
- **Scalable Architecture**: Stateless JWT authentication, Redis caching support
- **Comprehensive Security**: Helmet, rate limiting, XSS protection, NoSQL injection prevention

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB (Atlas) + Mongoose
- JWT Authentication
- Cloudinary (face image storage)
- Redis (optional, for caching)

### Frontend (Recommended)
- React + Vite
- Tailwind CSS
- html5-qrcode (QR scanning)
- face-api.js (face detection and embedding)
- WebRTC (camera access)

## Project Structure

```
professional-backend-structure-main/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js       # Authentication endpoints
│   ├── middlewares/
│   │   ├── authAttendance.middleware.js  # JWT verification
│   │   ├── rbac.middleware.js       # Role-based access control
│   │   └── security.middleware.js   # Security middleware
│   ├── models/
│   │   ├── attendanceUser.model.js  # User model with roles
│   │   ├── department.model.js      # Department model
│   │   ├── class.model.js           # Class/Course model
│   │   ├── attendanceSession.model.js # Session with QR
│   │   ├── attendance.model.js      # Attendance records
│   │   └── faceEmbedding.model.js   # Face embeddings
│   ├── routes/
│   │   └── auth.routes.js           # Auth routes
│   ├── utils/
│   │   ├── qr.util.js               # QR generation/verification
│   │   └── faceVerification.util.js # Face comparison
│   ├── validators/
│   │   └── auth.validators.js       # Zod validation schemas
│   ├── app-attendance.js            # Express app setup
│   └── index-attendance.js          # Entry point
├── plans/
│   └── attendance-system-architecture.md  # Detailed architecture
├── package.json
└── .env.example
```

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account (for face images)

### Setup

1. **Clone and install dependencies**
```bash
cd professional-backend-structure-main
npm install
```

2. **Create environment file**
```bash
cp .env.example .env
```

3. **Configure environment variables**
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
DB_NAME=attendance_system

# JWT
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
CORS_ORIGIN=http://localhost:3000

# QR Settings
QR_REFRESH_INTERVAL=15
QR_SECRET_SALT=your-qr-secret-salt

# Face Verification
FACE_SIMILARITY_THRESHOLD=0.6
LIVENESS_CONFIDENCE_THRESHOLD=0.8

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start the server**
```bash
npm run dev
```

## API Endpoints

### Authentication
```
POST /api/v1/auth/register     - Register new user
POST /api/v1/auth/login        - Login user
POST /api/v1/auth/logout       - Logout user
POST /api/v1/auth/refresh-token - Refresh access token
GET  /api/v1/auth/me           - Get current user
POST /api/v1/auth/change-password - Change password
```

### Admin (requires admin role)
```
POST /api/v1/admin/departments           - Create department
GET  /api/v1/admin/departments           - List departments
POST /api/v1/admin/faculty               - Add faculty
GET  /api/v1/admin/faculty               - List faculty
POST /api/v1/admin/students              - Add student
POST /api/v1/admin/students/bulk         - Bulk import students
GET  /api/v1/admin/students              - List students
GET  /api/v1/admin/statistics            - Dashboard statistics
```

### Faculty (requires faculty/admin role)
```
POST /api/v1/faculty/classes             - Create class
GET  /api/v1/faculty/classes             - List my classes
POST /api/v1/faculty/sessions/start      - Start attendance session
POST /api/v1/faculty/sessions/:id/end    - End session
GET  /api/v1/faculty/sessions/:id/qr     - Get current QR code
GET  /api/v1/faculty/reports/class/:id   - Class report
```

### Student (requires student role)
```
POST /api/v1/student/face/register       - Register face
GET  /api/v1/student/face/status         - Face registration status
POST /api/v1/student/attendance/verify-qr - Verify QR code
POST /api/v1/student/attendance/verify-face - Verify face
GET  /api/v1/student/attendance/history  - Attendance history
```

## Security Features

### Three-Layer Verification

1. **QR Verification**
   - HMAC-SHA256 signed QR codes
   - 15-second expiry window
   - Session-specific secrets

2. **Face Verification**
   - 128-dimensional face embeddings
   - Cosine similarity comparison (threshold: 0.6)
   - Anti-spoofing with liveness detection

3. **Server Validation**
   - Session active check
   - Duplicate prevention (compound index)
   - Location validation (optional)

### Anti-Proxy Measures

| Threat | Prevention |
|--------|------------|
| QR Screenshot | 15-second expiry |
| Remote Sharing | Time-based invalidation |
| WhatsApp Forwarding | HMAC signature |
| Fake Face Photo | Liveness detection |
| Video Replay | Active liveness checks |
| Duplicate Marking | Compound index |
| Replay Attack | HMAC validation |

## Database Models

### User
- Role-based access (student, faculty, admin)
- Department association
- Face registration status
- Enrollment/Employee ID

### Class
- Faculty assignment
- Student enrollment
- Schedule management
- Academic year tracking

### AttendanceSession
- QR secret for signing
- Time window management
- Location constraints
- Real-time statistics

### Attendance
- Compound index (sessionId + studentId)
- Verification timestamps
- Liveness scores
- Device information

## Development

### Running in Development
```bash
npm run dev
```

### Running Original Backend
```bash
npm run dev:original
```

### Installing New Dependencies
```bash
npm install express-rate-limit helmet qrcode redis zod
```

## Production Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/index-attendance.js"]
```

### Environment Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure CORS_ORIGIN properly
- [ ] Enable HTTPS
- [ ] Set up MongoDB Atlas IP whitelist
- [ ] Configure Redis for session caching
- [ ] Set up monitoring and logging

## Testing

### Manual Testing with Postman
1. Import the API endpoints
2. Set up environment variables
3. Test authentication flow
4. Test role-based access

### Test User Creation
```bash
# Create admin user directly in MongoDB or via API
# Then use admin to create faculty and students
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow existing code structure
4. Add proper validation and error handling
5. Submit pull request

## License

ISC

## Support

For issues and questions, please create an issue in the repository.