# Smart Attendance System Frontend Client

The frontend client is a Progressive Web App (PWA) built with React 18, Vite, and Tailwind CSS.

## Architecture

The client communicates with the Express backend using Axios and manages application state with Zustand. It caches face-api neural network weights through service workers for offline execution.

See the system architecture diagram in [smart-attendance-architecture.html](file:///c:/Users/Dell/Desktop/VS%20Code/Development/Attendance%20App/smart-attendance-architecture.html) or open `/architecture-diagram.html` in your web browser.

## Core Capabilities

- **Progressive Web App**: The application installs on mobile and desktop devices. It updates service workers automatically.
- **Biometric Face Capture**: Uses `@vladmandic/face-api` to detect facial landmarks and extract 128-dimensional embedding vectors.
- **Dynamic Liveness**: Evaluates Eye Aspect Ratio (EAR) delta blinks and head yaw movements in real time.
- **Bluetooth Proximity**: Reads classroom Bluetooth Low Energy beacon RSSI levels via the Web Bluetooth API.
- **Rotating QR Scanner**: Scans 14-second rotating QR codes via `html5-qrcode`.
- **Debarment Analytics UI**: Displays student Debarment Risk Index (DRI) gauges and faculty watchlists.

## Directory Layout

```
src/
├── components/
│   ├── common/        # Shared buttons, modals, and PWA installation prompts
│   ├── face/          # Camera stream, landmark detection, and liveness tracker
│   ├── layout/        # Navigation bars, sidebars, and authenticated shell
│   └── qr/            # Camera QR scanner and rotating canvas display
├── pages/
│   ├── admin/         # Departments, faculty rosters, and student registers
│   ├── auth/          # Login and role registration pages
│   ├── faculty/       # Class controls, session monitors, and report exports
│   └── student/       # QR scanner, face registration, and attendance records
├── services/
│   ├── api.js         # Axios HTTP client with interceptors
│   ├── ble.service.js # Web Bluetooth Low Energy scanner
│   └── pwa.service.js # Service worker registration and update listener
└── store/
    └── authStore.js   # Zustand global authentication state
```

## Setup Instructions

### 1. Install Dependencies

Run this command in the frontend directory:

```bash
npm install
```

### 2. Configure Environment

Create `.env` in the frontend directory:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your web browser.

### 4. Build for Production

```bash
npm run build
```

Vite compiles the production bundle and generates the service worker in `dist/`.

## License

ISC
