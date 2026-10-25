# Pranilash Reddy

**Software Engineer & Systems Enthusiast**  
Computer Science undergraduate (Minor in Business) at **IIIT Lucknow**.  
Focus areas: Distributed full-stack systems, real-time event architectures, client-side computer vision, and algorithmic engineering.

[GitHub](https://github.com/Pranilash) · [LinkedIn](https://www.linkedin.com/in/pranilash) · [Email](mailto:pranilash75@gmail.com) · [Codeforces](https://codeforces.com/profile/pranilash_reddy) · [CodeChef](https://www.codechef.com/users/pranilash)

---

## Featured Systems & Engineering Work

### 1. [Smart Attendance System](https://github.com/Pranilash/Attendance_App_v1)
*Autonomous Biometric & Dynamic Rotating QR Academic Platform*  
**Production Deployment**: [https://attendanceappv1.vercel.app](https://attendanceappv1.vercel.app)

A multi-tiered attendance platform engineered for university campuses to eliminate proxy attendance and classroom congestion.

- **Biometric Verification Pipeline**: Computes 128-dimensional facial vectors on client hardware with `@vladmandic/face-api`. Matches reference vectors using cosine similarity ($S \ge 0.60$).
- **Dynamic Liveness Challenge**: Issues single-use server challenge nonces. Requires randomized eye-blink and head-yaw movements to defeat photo and screen replay attacks.
- **Rotating HMAC Credentials**: Generates 14-second rotating QR payloads signed with HMAC-SHA256. Verifies proximity with classroom Bluetooth Low Energy (BLE) beacons.
- **Predictive Academic Analytics**: Calculates student Debarment Risk Index (DRI) from university requirements. Generates safe-absence margins and automated faculty watchlists.
- **Production Architecture**: Runs as a unified Vercel serverless monorepo. Uses React 18 PWA, Express.js, MongoDB Atlas, and Redis. Verified with 40 automated regression tests.

---

### 2. [ShareNet](https://github.com/pranilash/sharenet-web)
*Multi-Tenant Campus Resource Sharing & Circular Economy Platform*  
**Production Deployment**: [https://sharenet-web-1.onrender.com](https://sharenet-web-1.onrender.com)

A verified peer-to-peer campus marketplace designed to replace fragmented email and chat groups with structured, accountable exchanges.

- **Multi-Tenant Domain Scoping**: Isolates catalog feeds and transactions by institutional email domain (`.ac.in`). Supports 100+ Indian university campuses with zero cross-tenant data leakage.
- **Multi-Signal Recommendation Model**: Scores marketplace items dynamically from user behavior, category affinity, trust, and recency.
  $$\text{Score} = 3 \cdot \text{CategoryAffinity} + 2 \cdot \text{RecencyBoost} + 1 \cdot \text{TrustSignal} + 1 \cdot \text{ModeRelevance}$$
- **Real-Time Negotiation Engine**: Provides low-latency chat on Socket.IO with in-stream GPS meetup agreements and delivery confirmations.
- **Structured Transaction Lifecycle**: Enforces a five-stage contract lifecycle: Request → Agreement → Active → Return → Complete. Includes automated reminders and dispute mediation.

---

### 3. [SnapTix](https://github.com/PIYUSH-NAYAK/SnapTix)
*Decentralized Event Ticketing & Anti-Scalping Protocol*  
**Award**: HackHazards'25 Track Winner (Top 100 out of 15,000+ teams)

A Web3 event ticketing protocol designed to eradicate counterfeit tickets and unregulated secondary market exploitation.

- **Smart Contract Protocol**: Authored on-chain ticket contracts in Solidity. Deployed via Hardhat on Base (Ethereum L2) for minimal gas overhead.
- **Secondary Market Controls**: Enforces resale price caps and automated royalty distribution directly in contract bytecode to stop scalping.
- **Application Layer**: Next.js 15 App Router architecture with Wagmi and Ethers.js. Uses GROQ AI inference for personalized event matching.

---

### 4. [Gyo.Ai](https://github.com/Pranilash/GyoAi)
*On-Device Computer Vision Exercise Posture Assistant*  
**Hackathon**: HackOFiesta v5.0

A physical therapy and exercise tracking assistant focused on real-time biomechanical feedback.

- **Kinematic Pose Estimation**: Tracks 33 anatomical body landmarks at 60 fps using Google MediaPipe computer vision models.
- **Real-Time Angle Computation**: Computes joint angles in real time to assess exercise form and trigger immediate audio corrections.
- **Client Architecture**: Built with Flutter for on-device inference. Keeps camera video private on the device without cloud streaming.

---

## Technical Disciplines & Stack

```
Languages:        C++, TypeScript, JavaScript (ES6+), Python, Solidity, Dart, SQL
Backend & Cloud:  Node.js, Express.js, Socket.IO, Redis, MongoDB Atlas, PostgreSQL, Vercel, Docker
Frontend & Web:   React 18/19, Next.js (App Router), Vite, Tailwind CSS, Flutter, PWA (Workbox)
Systems & ML:     face-api.js (WebGL Biometrics), Google MediaPipe, GROQ AI, WebSockets, Git
```

---

## Competitive Programming & Algorithms

- **CodeChef 4★** (Peak Rating: 1800+)
- **Codeforces Specialist**
- **800+ Algorithmic Problems Solved** across LeetCode, Codeforces, CodeChef, and GeeksforGeeks.
- Core strengths: Graph Theory, Dynamic Programming, Greedy Algorithms, Segment Trees, and Disjoint Set Union (DSU).

---

## GitHub Activity

<p align="center">
  <img src="https://github-readme-stats-fast.vercel.app/api?username=pranilash&show_icons=true&theme=github_dark&hide_border=true&title_color=58a6ff&icon_color=1f6feb&text_color=c9d1d9&bg_color=0d1117" alt="GitHub Stats" width="48%" />
  <img src="https://github-readme-stats-fast.vercel.app/api/top-langs/?username=pranilash&layout=compact&theme=github_dark&hide_border=true&title_color=58a6ff&text_color=c9d1d9&bg_color=0d1117" alt="Top Languages" width="48%" />
</p>
