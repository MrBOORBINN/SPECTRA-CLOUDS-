# INFHOST Node Agent Setup Guide

This guide details how to install and connect a remote Linux VPS (Ubuntu 22.04 / 24.04 LTS) to the INFHOST Controller.

## Prerequisites
- Ubuntu/Debian VPS with root access
- Docker & Docker Compose or Node.js 20+
- OpenJDK 21
- Ports open: 25565-29999 (TCP/UDP)

## Step 1: Register Node in INFHOST Admin Panel
1. Sign in to INFHOST with an `ADMIN` account.
2. Navigate to **Admin Panel** → **Nodes** → **Add Node**.
3. Enter your Node details:
   - Node Name: `Europe-01 (Frankfurt)`
   - Location: `Germany`
   - Region: `Europe`
   - Public IP: Your VPS IPv4
   - Port Range: `25565 - 25650`
4. Click **Create Node**. The panel will generate a unique `Node ID` and `Node Secret Token`.

## Step 2: Install and Run the Node Agent Daemon

### Option A: Using Docker (Recommended)
```bash
docker run -d \
  --name infhost-agent \
  --restart unless-stopped \
  -e INFHOST_MASTER_URL="https://infhost.net" \
  -e NODE_ID="your_node_id" \
  -e NODE_TOKEN="your_node_token" \
  -p 25565-25650:25565-25650 \
  infhost/node-agent:latest
```

### Option B: Native Systemd Service
1. Clone the node-agent repository:
```bash
git clone https://github.com/infhost/node-agent.git /opt/infhost-agent
cd /opt/infhost-agent && npm install
```
2. Create environment file `/etc/infhost/agent.env`:
```ini
INFHOST_MASTER_URL=https://infhost.net
NODE_ID=your_node_id
NODE_TOKEN=your_node_token
```
3. Enable and start the systemd unit:
```bash
sudo systemctl enable --now infhost-agent
```

## Step 3: Verification
Once running, the Node will emit heartbeats every 15 seconds. The INFHOST dashboard will immediately switch from `NO NODE CONNECTED` to `Online [Connected]`, and servers can be provisioned in that region.
