// Node Agent API Router
// Dedicated controller endpoint for external VPS nodes running the INFHOST daemon

import express, { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { nodeService } from './services/nodeService';
import { serverService } from './services/serverService';
import { fileService } from './services/fileService';

export const nodeRouter = express.Router();

interface NodeRequest extends Request {
  nodeId?: string;
}

// Authentication middleware for Node Agent
function nodeAuthMiddleware(req: NodeRequest, res: Response, next: NextFunction) {
  const token = req.headers['x-node-token'] as string;
  const nodeId = req.headers['x-node-id'] as string;

  if (!token || !nodeId) {
    return res.status(401).json({ error: 'Unauthorized: Missing x-node-token or x-node-id headers' });
  }

  const node = db.nodes.get(nodeId);
  if (!node || node.authToken !== token) {
    return res.status(403).json({ error: 'Forbidden: Invalid node authentication credentials' });
  }

  req.nodeId = nodeId;
  next();
}

// Node Heartbeat endpoint
nodeRouter.post('/heartbeat', (req, res) => {
  const token = req.headers['x-node-token'] as string;
  const nodeId = req.headers['x-node-id'] as string;
  const { cpuUsagePct, ramUsedMb, diskUsedMb, activeServers } = req.body;

  if (!token || !nodeId) {
    return res.status(401).json({ error: 'Missing authentication headers' });
  }

  const result = nodeService.processHeartbeat(nodeId, token, {
    cpuUsagePct: Number(cpuUsagePct) || 0,
    ramUsedMb: Number(ramUsedMb) || 0,
    diskUsedMb: Number(diskUsedMb) || 0,
    activeServers: Number(activeServers) || 0
  });

  if (!result.success) {
    return res.status(403).json(result);
  }

  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Node Server Process Management
nodeRouter.get('/servers/:id/status', nodeAuthMiddleware, (req: NodeRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  res.json({
    status: server.status,
    playerCount: server.playerCount,
    uptimeSec: server.uptimeSec
  });
});

nodeRouter.get('/servers/:id/resources', nodeAuthMiddleware, (req: NodeRequest, res) => {
  const server = serverService.getServerById(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  res.json({
    cpuUsagePct: server.cpuUsagePct,
    ramUsedMb: server.ramUsedMb,
    diskUsedMb: server.diskUsedMb
  });
});

nodeRouter.post('/servers/:id/command', nodeAuthMiddleware, (req: NodeRequest, res) => {
  const { command } = req.body;
  const result = serverService.sendConsoleCommand(req.params.id, command, 'NODE_AGENT');
  res.json(result);
});

nodeRouter.get('/servers/:id/files', nodeAuthMiddleware, (req: NodeRequest, res) => {
  const folder = (req.query.path as string) || '';
  const files = fileService.getFiles(req.params.id, folder);
  res.json({ files });
});

nodeRouter.post('/servers/:id/files', nodeAuthMiddleware, (req: NodeRequest, res) => {
  const { path: filePath, content, isDirectory } = req.body;
  const ok = fileService.createFile(req.params.id, filePath, !!isDirectory, content || '', 'NODE_AGENT');
  res.json({ success: ok });
});

nodeRouter.delete('/servers/:id/files', nodeAuthMiddleware, (req: NodeRequest, res) => {
  const filePath = req.query.path as string;
  const ok = fileService.deleteFile(req.params.id, filePath, 'NODE_AGENT');
  res.json({ success: ok });
});
