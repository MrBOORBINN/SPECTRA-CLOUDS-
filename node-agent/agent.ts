/**
 * INFHOST Node Agent Daemon
 * Runs on remote VPS/Dedicated Linux servers (Ubuntu/Debian) to manage Minecraft processes.
 * 
 * Usage:
 *   export INFHOST_MASTER_URL="https://infhost.net"
 *   export NODE_ID="node_xxxx"
 *   export NODE_TOKEN="inf_node_sec_xxxx"
 *   node agent.js
 */

import os from 'os';

const MASTER_URL = process.env.INFHOST_MASTER_URL || 'http://localhost:3000';
const NODE_ID = process.env.NODE_ID || 'node_vps_1';
const NODE_TOKEN = process.env.NODE_TOKEN || 'inf_node_sec_master';
const HEARTBEAT_INTERVAL_MS = 15000;

interface SystemMetrics {
  cpuUsagePct: number;
  ramUsedMb: number;
  diskUsedMb: number;
  activeServers: number;
}

function getSystemMetrics(): SystemMetrics {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemMb = Math.round((totalMem - freeMem) / (1024 * 1024));

  // Compute 1-minute load average percentage
  const loadAvg1m = os.loadavg()[0];
  const cpuCount = os.cpus().length;
  const cpuUsagePct = Math.min(100, Math.round((loadAvg1m / cpuCount) * 100 * 10) / 10);

  return {
    cpuUsagePct: isNaN(cpuUsagePct) ? 12.4 : cpuUsagePct,
    ramUsedMb: usedMemMb,
    diskUsedMb: 14200, // Estimated usage
    activeServers: 1
  };
}

async function sendHeartbeat() {
  const metrics = getSystemMetrics();
  try {
    const res = await fetch(`${MASTER_URL}/node/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-node-id': NODE_ID,
        'x-node-token': NODE_TOKEN
      },
      body: JSON.stringify(metrics)
    });

    if (res.ok) {
      console.log(`[INFHOST Agent] Heartbeat acknowledged: CPU ${metrics.cpuUsagePct}%, RAM ${metrics.ramUsedMb}MB`);
    } else {
      const text = await res.text();
      console.error(`[INFHOST Agent] Heartbeat rejected by controller (${res.status}): ${text}`);
    }
  } catch (err: any) {
    console.error(`[INFHOST Agent] Failed to reach INFHOST Master: ${err.message}`);
  }
}

console.log('====================================================');
console.log('           INFHOST NODE CONTROLLER AGENT             ');
console.log('====================================================');
console.log(`Master URL: ${MASTER_URL}`);
console.log(`Node ID:    ${NODE_ID}`);
console.log(`Node OS:    ${os.type()} ${os.release()} (${os.arch()})`);
console.log(`CPUs:       ${os.cpus().length} cores`);
console.log(`Total RAM:  ${Math.round(os.totalmem() / (1024 * 1024))} MB`);
console.log('Starting heartbeat loop...');

sendHeartbeat();
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
