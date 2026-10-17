# Smart Attendance System - Deployment Guide

This guide covers the complete deployment process for the Smart Attendance System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [SSL Configuration](#ssl-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js 18+ 
- MongoDB Atlas account (or self-hosted MongoDB)
- Docker & Docker Compose (for containerized deployment)
- Cloudinary account (for image storage)
- Redis (optional, for caching)

### Required Credentials
- MongoDB Atlas connection string
- Cloudinary API credentials
- JWT secrets (generate strong random strings)
- SSL certificates (for production)

---

### Free Tier Database & Cloud Setup (100% Free Forever)

#### 1. MongoDB Atlas Free Tier (M0 Sandbox)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free **M0 Sandbox** cluster (AWS or GCP region closest to your campus, 512MB free forever, no credit card required).
3. **Database Access**: Create a Database User (e.g. `attendance_admin`) with password.
4. **Network Access**: Add IP Address `0.0.0.0/0` (Allow Access from Anywhere) so cloud hosts like Render/Vercel can connect.
5. **Get Connection String**: Click **Connect** → **Drivers (Node.js)** → copy the URI:
   ```env
   MONGODB_URI=mongodb+srv://attendance_admin:<password>@cluster0.xxxxx.mongodb.net/attendance?retryWrites=true&w=majority
   ```

#### 2. Upstash Redis Free Tier (Optional, Serverless)
1. Sign up at [upstash.com](https://upstash.com) (10,000 commands/day free forever).
2. Create a Redis database, select your nearest region.
3. Copy the TLS connection URL:
   ```env
   REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379
   ```

---

## Environment Setup

### Backend Environment Variables

Create a `.env` file in `professional-backend-structure-main/`:

```env
# Server
PORT=8000
NODE_ENV=production

# Database (Free Tier MongoDB Atlas or local Docker)
MONGODB_URI=mongodb+srv://attendance_admin:YourPassword@cluster0.xxxxx.mongodb.net/attendance?retryWrites=true&w=majority

# Authentication
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-chars
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# CORS
CORS_ORIGIN=http://localhost:5173

# Cloudinary (for face images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (optional, Upstash free tier or local)
REDIS_URL=rediss://default:YourPassword@endpoint.upstash.io:6379
```

### Frontend Environment Variables

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=https://your-domain.com/api
```

---

## Local Development

### Backend Setup

```bash
# Navigate to backend directory
cd professional-backend-structure-main

# Install dependencies
npm install

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

---

## Production Deployment

### Option A: Vercel Full-Stack Deployment (Recommended)

Both Frontend and Backend are hosted on a single domain on Vercel with zero CORS configuration and automatic first-party cookie handling.

#### 1. Migrate Data to MongoDB Atlas
Ensure your Atlas Network Access allows `0.0.0.0/0`, then run the migration from the project root:
```bash
npm run migrate:atlas -- "mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/attendance_app?retryWrites=true&w=majority"
```

#### 2. Deploy to Vercel
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select your GitHub repository.
3. Keep **Root Directory** set to `.` (root).
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `ACCESS_TOKEN_SECRET`: random secure 32+ character string
   - `ACCESS_TOKEN_EXPIRY`: `1d`
   - `REFRESH_TOKEN_SECRET`: random secure 32+ character string
   - `REFRESH_TOKEN_EXPIRY`: `10d`
   - `CLOUDINARY_CLOUD_NAME`: `dgak4ntpz`
   - `CLOUDINARY_API_KEY`: `723976556334967`
   - `CLOUDINARY_API_SECRET`: `gpboSg2Sxklmed9_Uhvc_1d99Kc`
   - `NODE_ENV`: `production`
5. Click **Deploy**. Vercel will build the React PWA and deploy the Express API as serverless functions under `https://<your-project>.vercel.app`.

---

### Option B: Traditional / Render Deployment

#### Backend

```bash
# Build and start
cd professional-backend-structure-main
npm ci --only=production
npm start
```

#### Frontend

```bash
# Build for production
cd frontend
npm ci
npm run build

# Serve with nginx or similar
# The build output is in frontend/dist/
```

### Option 2: Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Docker Deployment

### Building Images

```bash
# Build backend
docker build -t attendance-backend ./professional-backend-structure-main

# Build frontend
docker build -t attendance-frontend ./frontend
```

### Running Containers

```bash
# Run backend
docker run -d \
  --name backend \
  -p 8000:8000 \
  --env-file ./professional-backend-structure-main/.env \
  attendance-backend

# Run frontend
docker run -d \
  --name frontend \
  -p 80:80 \
  attendance-frontend
```

### Docker Compose

The included `docker-compose.yml` orchestrates all services:

```bash
# Start all services
docker-compose up -d

# Scale backend
docker-compose up -d --scale backend=3
```

---

## SSL Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

1. Place certificates in `nginx/ssl/`:
   - `fullchain.pem` - Certificate chain
   - `privkey.pem` - Private key

2. Uncomment HTTPS section in `nginx/nginx.conf`

3. Restart nginx:
   ```bash
   docker-compose restart nginx
   ```

---

## Monitoring & Logging

### Health Checks

- Backend: `GET /health`
- Returns server status and timestamp

### Logs

```bash
# View backend logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View all logs
docker-compose logs -f
```

### Recommended Monitoring Tools

- **PM2** for Node.js process management
- **Prometheus + Grafana** for metrics
- **ELK Stack** for log aggregation
- **Sentry** for error tracking

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Check MongoDB URI, network access, and firewall rules.

#### JWT Invalid Error
```
JsonWebTokenError: invalid signature
```
**Solution**: Ensure JWT secrets match between requests and are at least 32 characters.

#### Face Detection Not Working
```
Failed to load face detection models
```
**Solution**: Check internet connection for CDN models, or host models locally.

#### CORS Error
```
Access-Control-Allow-Origin
```
**Solution**: Update `CORS_ORIGIN` in backend `.env` to match frontend domain.

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=app:*
```

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] MongoDB access restricted
- [ ] Environment variables secured
- [ ] Regular backups configured
- [ ] Error messages sanitized
- [ ] Dependencies updated

---

## Performance Optimization

### Backend
- Enable Redis caching
- Use connection pooling for MongoDB
- Implement request compression
- Enable cluster mode for multi-core CPUs

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Cache face detection models locally

---

## Support

For issues and feature requests, please create an issue in the repository.

---

**Last Updated**: February 2024