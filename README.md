# INFHOST — Host Beyond Limits
**Production-Oriented Minecraft Server Hosting Platform**

INFHOST is a modern Minecraft server hosting architecture designed for real VPS and dedicated cloud node infrastructure.

---

## ⚡ Core Philosophy: Zero-Fake Architecture
- **No Fake Servers**: When no VPS node is paired, the platform strictly displays **`NO NODE CONNECTED`**.
- **No Fake IP Addresses**: Server addresses follow `server-name.infhost.net:PORT` based on real dynamic port allocations.
- **No Hallucinated Telemetry**: CPU, RAM, and player counts strictly report live process status or display `NODE OFFLINE`.
- **Real File Manager**: Browse, edit, and save real Minecraft configuration files (`server.properties`, `eula.txt`, `spigot.yml`, `paper-global.yml`).
- **Server-Authoritative Credits**: Financial transactions and voucher redemptions are atomically committed to the backend database.

---

## 🚀 Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Run fullstack development server (Express API + Vite Frontend on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Production Deployment (Docker Compose)

```bash
docker compose up -d
```
This boots:
1. **PostgreSQL 16**: Relational storage with Prisma schema
2. **INFHOST Web Panel & API**: Fullstack application
3. **INFHOST Node Agent**: Daemon controller managing Minecraft server ports 25565–25600

---

## 📁 Repository Structure
```
├── /backend/             # Express REST API, Node controller, and services
│   ├── /services/        # Server lifecycle, file manager, credits, billing, nodes
│   ├── db.ts             # Relational data store matching Prisma models
│   └── apiRouter.ts      # Authenticated REST endpoints
├── /node-agent/          # Standalone daemon for Ubuntu/Debian VPS nodes
├── /prisma/              # Prisma relational database schema
├── /docs/                # Architecture, API, Node Setup, and Security docs
├── /src/                 # React 19 + Tailwind CSS frontend dashboard
│   ├── /components/      # UI views: Dashboard, Servers, Console, Files, Billing, Admin
│   ├── App.tsx           # Primary application view manager
│   └── index.css         # Styling system
└── server.ts             # Unified full-stack server
```

---

## 🔐 Credentials & Default Accounts
- **Standard User**: `infbuisness01@gmail.com` / `password123` (35 Credits, Free Plan)
- **Administrator**: `admin@infhost.net` / `admin123` (1000 Credits, Full Admin Access)
- **Official Business & Support**: `infbuisness01@gmail.com`
- **Active Redeem Codes**:
  - `INFHOST-WELCOME-100` (+100 Credits)
  - `INFHOST-FREE-35` (+35 Credits)
  - `INFHOST-BOOST-250` (+250 Credits)
