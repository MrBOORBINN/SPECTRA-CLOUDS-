// Node Controller Service
// Handles VPS / Node Agent registration, heartbeats, health evaluation, and resource allocations

import crypto from 'crypto';
import { db } from '../db';
import { Node, NodeStatus } from '../types';

export class NodeService {
  // Evaluates node heartbeats to mark stale nodes OFFLINE
  public checkNodeHealth() {
    const now = Date.now();
    for (const node of db.nodes.values()) {
      if (!node.lastHeartbeat) {
        node.status = 'OFFLINE';
        continue;
      }
      const diffMs = now - new Date(node.lastHeartbeat).getTime();
      // If node hasn't pinged in 45 seconds, mark OFFLINE
      if (diffMs > 45000 && node.status !== 'MAINTENANCE') {
        node.status = 'OFFLINE';
      }
    }
  }

  public getAllNodes(): Node[] {
    this.checkNodeHealth();
    return Array.from(db.nodes.values());
  }

  public getOnlineNodes(): Node[] {
    this.checkNodeHealth();
    return Array.from(db.nodes.values()).filter(n => n.status === 'ONLINE');
  }

  public getNodeById(id: string): Node | undefined {
    this.checkNodeHealth();
    return db.nodes.get(id);
  }

  public getAvailableLocations(): { location: string; region: string; nodeCount: number }[] {
    this.checkNodeHealth();
    const online = this.getOnlineNodes();
    const locMap = new Map<string, { region: string; count: number }>();

    for (const node of online) {
      const existing = locMap.get(node.location);
      if (existing) {
        existing.count++;
      } else {
        locMap.set(node.location, { region: node.region, count: 1 });
      }
    }

    return Array.from(locMap.entries()).map(([location, data]) => ({
      location,
      region: data.region,
      nodeCount: data.count
    }));
  }

  // Register a new Node from Admin Panel
  public registerNode(data: {
    name: string;
    location: string;
    region: string;
    hostname: string;
    privateIp: string;
    publicIp: string;
    apiEndpoint: string;
    cpuCapacity: number;
    ramCapacity: number;
    diskCapacity: number;
  }, adminId: string): { node: Node; nodeToken: string } {
    const id = 'node_' + crypto.randomBytes(4).toString('hex');
    const rawToken = 'inf_node_sec_' + crypto.randomBytes(24).toString('hex');

    const node: Node = {
      id,
      name: data.name,
      location: data.location,
      region: data.region,
      hostname: data.hostname,
      privateIp: data.privateIp,
      publicIp: data.publicIp,
      apiEndpoint: data.apiEndpoint,
      authToken: rawToken,
      cpuCapacity: data.cpuCapacity,
      ramCapacity: data.ramCapacity,
      diskCapacity: data.diskCapacity,
      status: 'OFFLINE', // Remains OFFLINE until first valid heartbeat
      lastHeartbeat: null,
      cpuUsagePct: 0,
      ramUsedMb: 0,
      diskUsedMb: 0,
      activeServers: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.nodes.set(node.id, node);
    db.logAudit('NODE', 'REGISTER_NODE', adminId, { nodeId: id, name: data.name, location: data.location });

    return { node, nodeToken: rawToken };
  }

  // Authenticate and process heartbeat from Node Agent
  public processHeartbeat(nodeId: string, token: string, stats: {
    cpuUsagePct: number;
    ramUsedMb: number;
    diskUsedMb: number;
    activeServers: number;
  }): { success: boolean; error?: string } {
    const node = db.nodes.get(nodeId);
    if (!node) {
      return { success: false, error: 'Node not registered' };
    }

    if (node.authToken !== token) {
      return { success: false, error: 'Unauthorized node token' };
    }

    node.status = 'ONLINE';
    node.lastHeartbeat = new Date().toISOString();
    node.cpuUsagePct = stats.cpuUsagePct;
    node.ramUsedMb = stats.ramUsedMb;
    node.diskUsedMb = stats.diskUsedMb;
    node.activeServers = stats.activeServers;
    if ((stats as any).publicIp && (stats as any).publicIp !== '141.95.72.48') {
      node.publicIp = (stats as any).publicIp;
    }
    node.updatedAt = new Date().toISOString();

    return { success: true };
  }

  // Allocate an available Minecraft port on a node
  public allocatePort(nodeId: string): number {
    const usedPorts = new Set<number>();
    for (const alloc of db.allocations.values()) {
      if (alloc.nodeId === nodeId) {
        usedPorts.add(alloc.port);
      }
    }

    // Standard Minecraft ports range: 25565 - 29999
    for (let port = 25565; port <= 29999; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }
    return 25565;
  }

  // Admin Quick Connect Test VPS Node
  public connectSimulatorNode(location: string = 'Germany', region: string = 'Europe'): Node {
    const id = 'node_vps_1';
    let node = db.nodes.get(id);

    if (!node) {
      node = {
        id,
        name: 'Europe-01 (Frankfurt)',
        location,
        region,
        hostname: 'fra-node1.infhost.net',
        privateIp: '',
        publicIp: '', // Only populated after a real VPS Node Agent connects and reports its actual public IP
        apiEndpoint: 'https://fra-node1.infhost.net:8443',
        authToken: 'inf_node_sec_simulator_fra01',
        cpuCapacity: 8,
        ramCapacity: 32768, // 32 GB
        diskCapacity: 256000, // 250 GB
        status: 'ONLINE',
        lastHeartbeat: new Date().toISOString(),
        cpuUsagePct: 14.2,
        ramUsedMb: 6144,
        diskUsedMb: 24500,
        activeServers: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.nodes.set(node.id, node);
      db.logAudit('NODE', 'SIMULATOR_NODE_CONNECTED', null, { nodeId: node.id });
    } else {
      node.status = 'ONLINE';
      node.lastHeartbeat = new Date().toISOString();
    }
    return node;
  }

  public deleteNode(nodeId: string, adminId: string): boolean {
    const node = db.nodes.get(nodeId);
    if (!node) return false;

    // Disconnect servers on this node
    for (const server of db.servers.values()) {
      if (server.nodeId === nodeId) {
        server.nodeId = null;
        server.status = 'NO_NODE';
      }
    }

    db.nodes.delete(nodeId);
    db.logAudit('NODE', 'DELETE_NODE', adminId, { nodeId });
    return true;
  }
}

export const nodeService = new NodeService();
