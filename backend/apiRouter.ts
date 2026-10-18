// INFHOST Unified API Router
// Production REST endpoints with role permissions, input validation, and audit trail

import express, { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { authService } from './services/authService';
import { nodeService } from './services/nodeService';
import { serverService } from './services/serverService';
import { fileService } from './services/fileService';
import { backupService } from './services/backupService';
import { creditsService } from './services/creditsService';
import { billingService } from './services/billingService';
import { softwareService } from './services/softwareService';
import { dnsService } from './services/dnsService';
import { User } from './types';

export const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Middleware: Authenticate Bearer or Cookie Token
interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-session-token'] as string);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  const user = authService.validateSession(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  req.user = user;
  next();
}

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

// Optional Auth (for public or initial bootstrap)
export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-session-token'] as string);
  if (token) {
    const user = authService.validateSession(token);
    if (user) req.user = user;
  }
  next();
}

// ==========================================
// 1. AUTH ROUTES
// ==========================================
apiRouter.post('/auth/register', (req, res) => {
  const { email, username, password } = req.body;
  const result = authService.register({ email, username, password });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const result = authService.login({ email, password });
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/auth/logout', authMiddleware, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.substring(7) || (req.headers['x-session-token'] as string);
  if (token) authService.logout(token);
  res.json({ success: true });
});

apiRouter.get('/user', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ user: null, credits: 0 });
  }
  const wallet = creditsService.getOrCreateWallet(req.user.id);
  res.json({
    user: req.user,
    credits: wallet.balance
  });
});

apiRouter.get('/user/credits', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ balance: 0, transactions: [] });
  }
  const wallet = creditsService.getOrCreateWallet(req.user.id);
  const transactions = creditsService.getTransactions(req.user.id);
  res.json({
    balance: wallet.balance,
    transactions
  });
});

// ==========================================
// 2. NODES ROUTES
// ==========================================
apiRouter.get('/nodes', (req, res) => {
  const nodes = nodeService.getAllNodes();
  const online = nodeService.getOnlineNodes();
  res.json({
    totalNodes: nodes.length,
    onlineNodes: online.length,
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      location: n.location,
      region: n.region,
      status: n.status,
      cpuCapacity: n.cpuCapacity,
      ramCapacity: n.ramCapacity,
      diskCapacity: n.diskCapacity,
      cpuUsagePct: n.cpuUsagePct,
      ramUsedMb: n.ramUsedMb,
      diskUsedMb: n.diskUsedMb,
      activeServers: n.activeServers,
      lastHeartbeat: n.lastHeartbeat
    }))
  });
});

apiRouter.get('/nodes/locations', (req, res) => {
  const locations = nodeService.getAvailableLocations();
  res.json({ locations });
});

// Admin simulator connect for testing
apiRouter.post('/admin/nodes/simulator-connect', authMiddleware, adminMiddleware, (req, res) => {
  const { location, region } = req.body;
  const node = nodeService.connectSimulatorNode(location, region);
  res.json({ success: true, node });
});

// ==========================================
// 3. SERVER ROUTES
// ==========================================
apiRouter.get('/servers', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ servers: [] });
  }
  const servers = req.user.role === 'ADMIN' && req.query.all === 'true'
    ? serverService.getAllServers()
    : serverService.getUserServers(req.user.id);
  res.json({ servers });
});

apiRouter.post('/servers', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { name, software, version, ramMb, cpuCores, storageMb, location, region, timezone, description } = req.body;

  if (!name || !software || !version || !ramMb || !cpuCores || !storageMb) {
    return res.status(400).json({ error: 'Missing required server configuration parameters.' });
  }

  const result = serverService.createServer(
    { name, software, version, ramMb, cpuCores, storageMb, location: location || 'Germany', region: region || 'Europe', timezone: timezone || 'UTC', description },
    req.user!.id
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json(result);
});

apiRouter.get('/servers/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const dnsStatus = dnsService.getDnsStatus(server.subdomain);
  res.json({ server, dnsStatus });
});

apiRouter.delete('/servers/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = serverService.deleteServer(req.params.id, req.user!.id);
  res.json(result);
});

apiRouter.post('/servers/:id/start', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await serverService.startServer(req.params.id, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/servers/:id/stop', authMiddleware, (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = serverService.stopServer(req.params.id, req.user!.id);
  res.json(result);
});

apiRouter.post('/servers/:id/restart', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await serverService.restartServer(req.params.id, req.user!.id);
  res.json(result);
});

apiRouter.post('/servers/:id/kill', authMiddleware, (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = serverService.killServer(req.params.id, req.user!.id);
  res.json(result);
});

// Console
apiRouter.get('/servers/:id/console', authMiddleware, (req: AuthenticatedRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const logs = db.consoleLogs.get(server.id) || [];
  res.json({ logs, status: server.status });
});

apiRouter.post('/servers/:id/command', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { command } = req.body;
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = serverService.sendConsoleCommand(req.params.id, command, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// ==========================================
// 4. SERVER FILES
// ==========================================
apiRouter.get('/servers/:id/files', authMiddleware, (req: AuthenticatedRequest, res) => {
  const folder = (req.query.path as string) || '';
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const files = fileService.getFiles(req.params.id, folder);
  res.json({ files });
});

apiRouter.get('/servers/:id/files/content', authMiddleware, (req: AuthenticatedRequest, res) => {
  const filePath = req.query.path as string;
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const fileData = fileService.getFileContent(req.params.id, filePath);
  if (!fileData) return res.status(404).json({ error: 'File not found' });
  res.json(fileData);
});

apiRouter.post('/servers/:id/files/content', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { path: filePath, content } = req.body;
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  fileService.saveFileContent(req.params.id, filePath, content, req.user!.id);
  res.json({ success: true });
});

apiRouter.post('/servers/:id/files/create', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { path: filePath, isDirectory, content } = req.body;
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const ok = fileService.createFile(req.params.id, filePath, !!isDirectory, content || '', req.user!.id);
  if (!ok) return res.status(400).json({ error: 'File or folder already exists' });
  res.json({ success: true });
});

apiRouter.delete('/servers/:id/files', authMiddleware, (req: AuthenticatedRequest, res) => {
  const filePath = req.query.path as string;
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const ok = fileService.deleteFile(req.params.id, filePath, req.user!.id);
  res.json({ success: ok });
});

// ==========================================
// 5. SERVER BACKUPS
// ==========================================
apiRouter.get('/servers/:id/backups', authMiddleware, (req: AuthenticatedRequest, res) => {
  const backups = backupService.getServerBackups(req.params.id);
  res.json({ backups });
});

apiRouter.post('/servers/:id/backups', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const backup = await serverService.createBackup(req.params.id, req.user!.id);
    res.status(201).json({ success: true, backup });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/servers/:id/backups/schedule', authMiddleware, (req: AuthenticatedRequest, res) => {
  const schedule = serverService.getBackupSchedule(req.params.id);
  res.json({ schedule });
});

apiRouter.post('/servers/:id/backups/schedule', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { frequency, retentionCount } = req.body;
  const config = serverService.updateBackupSchedule(
    req.params.id,
    {
      frequency: frequency || 'daily',
      retentionCount: retentionCount ? parseInt(retentionCount, 10) : 5,
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 86400000).toISOString()
    },
    req.user!.id
  );
  res.json({ success: true, schedule: config });
});

apiRouter.post('/servers/:id/backups/:bId/restore', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const result = await serverService.restoreBackup(req.params.id, req.params.bId, req.user!.id);
  res.json(result);
});

apiRouter.delete('/servers/:id/backups/:bId', authMiddleware, (req: AuthenticatedRequest, res) => {
  const ok = backupService.deleteBackup(req.params.id, req.params.bId, req.user!.id);
  res.json({ success: ok });
});

// ==========================================
// 6. RESOURCE MONITORING & ALERTS
// ==========================================
apiRouter.get('/servers/:id/alerts', authMiddleware, (req: AuthenticatedRequest, res) => {
  const settings = serverService.getAlertSettings(req.params.id);
  const events = serverService.checkResourceAlerts(req.params.id);
  res.json({ settings, events });
});

apiRouter.post('/servers/:id/alerts', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { enabled, cpuThresholdPct, ramThresholdPct, diskThresholdPct, emailNotify } = req.body;
  const settings = serverService.updateAlertSettings(
    req.params.id,
    {
      enabled: enabled !== undefined ? !!enabled : true,
      cpuThresholdPct: cpuThresholdPct ? parseInt(cpuThresholdPct, 10) : 90,
      ramThresholdPct: ramThresholdPct ? parseInt(ramThresholdPct, 10) : 85,
      diskThresholdPct: diskThresholdPct ? parseInt(diskThresholdPct, 10) : 85,
      emailNotify: emailNotify !== undefined ? !!emailNotify : true
    },
    req.user!.id
  );
  res.json({ success: true, settings });
});

apiRouter.get('/servers/:id/alerts/events', authMiddleware, (req: AuthenticatedRequest, res) => {
  const events = serverService.getAlertEvents(req.params.id);
  res.json({ events });
});

// ==========================================
// 7. CREDITS & REDEEM CODES
// ==========================================
apiRouter.post('/credits/redeem', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Redeem code is required' });

  const result = creditsService.redeemCode(req.user!.id, code);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const wallet = creditsService.getOrCreateWallet(req.user!.id);
  res.json({
    success: true,
    creditsAdded: result.creditsAdded,
    newBalance: wallet.balance
  });
});

apiRouter.post('/credits/earn', authMiddleware, (req: AuthenticatedRequest, res) => {
  const result = creditsService.adjustCredits(
    req.user!.id,
    25,
    'OFFER_REWARD',
    'Daily check-in / activity reward bonus',
    'BONUS_' + Date.now()
  );
  res.json(result);
});

// ==========================================
// 8. SOFTWARE, PLUGINS & MODS
// ==========================================
apiRouter.get('/software', (req, res) => {
  res.json({ software: softwareService.getSoftwareCatalog() });
});

apiRouter.get('/plugins', (req, res) => {
  const list = Array.from(db.plugins.values());
  res.json({ plugins: list });
});

apiRouter.get('/mods', (req, res) => {
  const list = Array.from(db.mods.values());
  res.json({ mods: list });
});

apiRouter.get('/servers/:id/packages', authMiddleware, (req: AuthenticatedRequest, res) => {
  const packages = serverService.getInstalledPackages(req.params.id);
  res.json({ packages });
});

apiRouter.post('/servers/:id/packages/install', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { packageId, type } = req.body;
  if (!packageId || !type) {
    return res.status(400).json({ error: 'packageId and type (plugin|mod) are required.' });
  }

  const result = serverService.installPackage(req.params.id, packageId, type, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/servers/:id/packages/uninstall', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { packageId } = req.body;
  if (!packageId) return res.status(400).json({ error: 'packageId is required' });

  const result = serverService.uninstallPackage(req.params.id, packageId, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

apiRouter.post('/servers/:id/packages/update', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { packageId } = req.body;
  if (!packageId) return res.status(400).json({ error: 'packageId is required' });

  const result = serverService.updatePackage(req.params.id, packageId, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

// ==========================================
// 8. BILLING & PLANS
// ==========================================
apiRouter.get('/billing/plans', (req, res) => {
  res.json({ plans: billingService.getPlans() });
});

apiRouter.get('/billing/orders', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ orders: billingService.getUserOrders(req.user!.id) });
});

apiRouter.post('/billing/orders', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { planId, amount, currency, provider } = req.body;
  const order = billingService.createOrder({
    userId: req.user!.id,
    planId,
    amount,
    currency: currency || 'INR',
    provider: provider || 'TEST_SANDBOX'
  });
  res.json({ order });
});

apiRouter.post('/billing/webhook', (req, res) => {
  const { orderId, event, signature } = req.body;
  const result = billingService.processWebhook({ orderId, event, signature });
  res.json(result);
});

// ==========================================
// 9. ADMIN PANEL ROUTES
// ==========================================
apiRouter.get('/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = Array.from(db.users.values()).map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    status: u.status,
    credits: creditsService.getOrCreateWallet(u.id).balance,
    serversCount: Array.from(db.servers.values()).filter(s => s.userId === u.id).length,
    createdAt: u.createdAt
  }));
  res.json({ users });
});

apiRouter.post('/admin/users/:id/suspend', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res) => {
  const u = db.users.get(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  u.status = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  db.logAudit('ADMIN', 'TOGGLE_USER_SUSPENSION', req.user!.id, { targetUserId: u.id, status: u.status });
  res.json({ success: true, status: u.status });
});

apiRouter.post('/admin/users/:id/credits', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res) => {
  const { amount, reason } = req.body;
  const u = db.users.get(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });

  const result = creditsService.adjustCredits(
    u.id,
    Number(amount),
    'ADMIN_ADJUSTMENT',
    reason || 'Admin balance adjustment',
    req.user!.id
  );
  res.json(result);
});

apiRouter.get('/admin/nodes', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ nodes: nodeService.getAllNodes() });
});

apiRouter.post('/admin/nodes', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res) => {
  const { name, location, region, hostname, privateIp, publicIp, apiEndpoint, cpuCapacity, ramCapacity, diskCapacity } = req.body;
  const result = nodeService.registerNode(
    { name, location, region, hostname, privateIp, publicIp, apiEndpoint, cpuCapacity, ramCapacity, diskCapacity },
    req.user!.id
  );
  res.status(201).json(result);
});

apiRouter.delete('/admin/nodes/:id', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res) => {
  const ok = nodeService.deleteNode(req.params.id, req.user!.id);
  res.json({ success: ok });
});

apiRouter.get('/admin/redeem-codes', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ codes: creditsService.getAllCodes() });
});

apiRouter.post('/admin/redeem-codes', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res) => {
  const { code, creditValue, expiresAt } = req.body;
  const newCode = creditsService.createCode({ code, creditValue: Number(creditValue), expiresAt }, req.user!.id);
  res.status(201).json({ code: newCode });
});

apiRouter.post('/admin/redeem-codes/:code/toggle', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res) => {
  const ok = creditsService.toggleCodeStatus(req.params.code, req.user!.id);
  res.json({ success: ok });
});

apiRouter.get('/admin/audit-logs', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ logs: db.auditLogs.slice(0, 100) });
});
