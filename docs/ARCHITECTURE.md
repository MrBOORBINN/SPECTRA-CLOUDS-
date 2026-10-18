# INFHOST Architecture & System Design

## 1. System Overview

```
User (Browser / Mobile)
       ↓
INFHOST Web Panel (React + TypeScript + Tailwind)
       ↓  (HTTPS / WebSocket / JSON)
INFHOST Backend API (Express.js / Node.js Controller)
       ↓  (Secure Internal Node RPC / Token Authentication)
Node / Hosting Controller (Dedicated Agent)
       ↓  (Container runtime / Linux cgroups / Java 21)
Minecraft Node / VPS (Physical or Cloud Server)
       ↓  (STDIN / STDOUT sockets)
Minecraft Server Process (Paper, Purpur, Fabric, etc.)
```

## 2. Key Architectural Guarantees

1. **No Frontend Execution**: The web client never communicates with server processes or OS shells directly.
2. **Zero Fake Metrics**:
   - If no VPS node is connected, the UI explicitly shows: **`NO NODE CONNECTED`**.
   - No fake IP addresses (`198.51.100.x`, `192.0.2.x`, etc.) are ever hallucinated.
   - Resource meters read real node telemetry or display `NODE OFFLINE`.
3. **Multi-Region Node Controller**:
   - Nodes can be registered in **Europe** and **Asia** (e.g., Germany, France, United Kingdom, Singapore, India, Japan).
   - Server creation only permits locations where an active, healthy node exists.
4. **Authoritative Wallet & Credits**:
   - Credits are stored server-side with strict ledger accounting (`CreditTransaction`).
   - Client modifications cannot manipulate balances.
5. **DNS & Networking Abstraction**:
   - Addresses resolve to `server-name.infhost.net:PORT`.
   - Ports are dynamically allocated (25565–29999).
   - If DNS integration is unconfigured, displays `DNS NOT CONFIGURED`.
