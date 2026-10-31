# Pranilash Reddy

**Software Engineer & Systems Enthusiast**  
Computer Science undergraduate (Minor in Business) at **IIIT Lucknow**.  
Focus areas: Distributed full-stack systems, real-time event architectures, client-side computer vision, and algorithmic engineering.

[GitHub](https://github.com/Pranilash) · [LinkedIn](https://www.linkedin.com/in/pranilash) · [Email](mailto:pranilash75@gmail.com) · [Codeforces](https://codeforces.com/profile/pranilash_reddy) · [CodeChef](https://www.codechef.com/users/pranilash)

---

## Featured Systems & Engineering Work

### 1. [Smart Attendance System](https://github.com/Pranilash/Attendance_App_v1)
*Autonomous Biometric & Dynamic Rotating QR Academic Platform*  
**Production**: [attendanceappv1.vercel.app](https://attendanceappv1.vercel.app) · **CI/CD**: [GitHub Actions (Automated)](https://github.com/Pranilash/Attendance_App_v1/actions/workflows/ci.yml) · **Stack**: React 18 PWA, Express.js, MongoDB Atlas, Redis

A production-grade, multi-tiered attendance platform engineered for university campuses to eliminate proxy attendance, credential replay, and classroom bottlenecking.

- **Client-Side Biometric Verification**: Generates 128-dimensional facial feature vectors directly on client hardware with `@vladmandic/face-api` (WebGL backend). Matches reference vectors using cosine similarity ($S \ge 0.60$) with zero raw biometrics transmitted or stored on cloud servers.
- **Dynamic Nonce-Based Liveness**: Coordinates single-use server challenge nonces requiring real-time eye aspect ratio (EAR) blink detection and head yaw delta verification to reject high-resolution screen replays and printed photo spoofing.
- **Proximity & Cryptographic Payloads**: Emits 14-second rotating QR payloads signed with HMAC-SHA256, verified alongside physical Bluetooth Low Energy (BLE) classroom beacon RSSI signal thresholds.
- **Predictive Debarment Risk Index (DRI)**: Computes real-time student debarment risk against institutional policy thresholds, providing automated faculty watchlists and an interactive what-if simulator with verification receipt slips.
- **Academic Timetable & Lecture Theater Engine**: Orchestrates weekly course timetables across student and faculty portals, paired with a real-time attendee drawer and full-screen projector theater mode for high-density lecture halls.
- **Architecture & Operational Reliability**: Serverless monorepo on Vercel with Workbox PWA offline caching, Dockerized Nginx reverse proxy for local/offline deployment, and automated GitHub Actions CI verifying ESLint, Vite compilation, and 40 live endpoint regression tests.

---

### 2. [ShareNet](https://github.com/pranilash/sharenet-web)
*Multi-Tenant Campus Resource Sharing & Circular Economy Platform*  
**Production**: [sharenet-web-1.onrender.com](https://sharenet-web-1.onrender.com) · **Stack**: Node.js, Express.js, Socket.IO, PostgreSQL, Redis

A verified peer-to-peer campus marketplace designed to replace fragmented email and chat groups with structured, accountable exchanges across university campuses.

- **Multi-Tenant Domain Scoping**: Strictly isolates catalog feeds and ledger transactions by institutional email domain (`.ac.in`), supporting 100+ university domains with zero cross-tenant data leakage.
- **Multi-Signal Recommendation Model**: Scores and ranks marketplace listings dynamically using behavioral telemetry, category affinity, trust metrics, and recency decay:
  $$\text{Score} = 3 \cdot \text{CategoryAffinity} + 2 \cdot \text{RecencyBoost} + 1 \cdot \text{TrustSignal} + 1 \cdot \text{ModeRelevance}$$
- **Real-Time Transaction Lifecycle**: Coordinates a structured 5-stage state machine (Request → Agreement → Active → Return → Complete) with low-latency Socket.IO negotiation and in-stream GPS meetup confirmations.

---

### 3. [SnapTix](https://github.com/PIYUSH-NAYAK/SnapTix)
*Decentralized Event Ticketing & Anti-Scalping Protocol*  
**Recognition**: HackHazards'25 Track Winner (Top 100 of 15,000+ teams) · **Stack**: Solidity, Base (Ethereum L2), Next.js 15, Ethers.js

A Web3 event ticketing protocol designed to eradicate counterfeit tickets and unregulated secondary market exploitation through programmable smart contract enforcement.

- **Smart Contract Protocol**: Authored on-chain ERC ticket contracts in Solidity and deployed on Base (Ethereum L2) for sub-cent gas transaction finality.
- **On-Chain Secondary Market Controls**: Enforces resale price caps and automated creator royalty distributions directly in smart contract bytecode, structurally preventing scalper bot exploitation.
- **Application Architecture**: Next.js 15 App Router interface integrated with Wagmi and Ethers.js, paired with GROQ AI inference for semantic attendee-event matching.

---

### 4. [Gyo.Ai](https://github.com/Pranilash/GyoAi)
*On-Device Computer Vision Exercise Posture Assistant*  
**Recognition**: HackOFiesta v5.0 · **Stack**: Flutter, Google MediaPipe, Dart

An on-device biomechanical feedback assistant for exercise form verification and physical therapy guidance.

- **Kinematic Pose Estimation**: Tracks 33 anatomical landmarks at 60 fps using Google MediaPipe vision models running locally on client hardware.
- **Biomechanical Angle Inference**: Computes multi-joint kinematic vectors in real time to evaluate exercise form and trigger immediate audio corrective cues.
- **Privacy-Preserving Edge Architecture**: Built with Flutter for zero-network edge processing, ensuring camera feeds never leave user devices.

---

## Technical Stack & Systems Experience

```
Languages:        C++, TypeScript, JavaScript (ES6+), Python, Solidity, Dart, SQL
Backend & Cloud:  Node.js, Express.js, Socket.IO, Redis, MongoDB Atlas, PostgreSQL, Docker, Nginx, Vercel, GitHub Actions CI/CD
Frontend & Web:   React 18/19, Next.js (App Router), Vite, Tailwind CSS, Flutter, Progressive Web Apps (PWA)
Systems & Vision: face-api.js (WebGL Biometrics), Google MediaPipe, WebSockets, REST APIs, Git
```

---

## Competitive Programming & Algorithms

- **CodeChef 4★** (Peak Rating: 1800+) · **Codeforces Specialist**
- **800+ Algorithmic Problems Solved** across LeetCode, Codeforces, CodeChef, and GeeksforGeeks.
- Core strengths: Graph Theory, Dynamic Programming, Greedy Algorithms, Segment Trees, and Disjoint Set Union (DSU).

---

## GitHub Activity

<p align="center">
  <img src="https://github-readme-stats-fast.vercel.app/api?username=pranilash&show_icons=true&theme=github_dark&hide_border=true&title_color=58a6ff&icon_color=1f6feb&text_color=c9d1d9&bg_color=0d1117" alt="GitHub Stats" width="48%" />
  <img src="https://github-readme-stats-fast.vercel.app/api/top-langs/?username=pranilash&layout=compact&theme=github_dark&hide_border=true&title_color=58a6ff&text_color=c9d1d9&bg_color=0d1117" alt="Top Languages" width="48%" />
</p>
