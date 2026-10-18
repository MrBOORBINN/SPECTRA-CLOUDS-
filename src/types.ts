// Frontend Shared Types

export type Role = 'USER' | 'ADMIN';

export type ServerStatus =
  | 'INSTALLING'
  | 'STARTING'
  | 'ONLINE'
  | 'STOPPING'
  | 'OFFLINE'
  | 'CRASHED'
  | 'ERROR'
  | 'NO_NODE';

export type NodeStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE';

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Node {
  id: string;
  name: string;
  location: string;
  region: string;
  hostname?: string;
  publicIp: string;
  status: NodeStatus;
  cpuCapacity: number;
  ramCapacity: number;
  diskCapacity: number;
  cpuUsagePct: number;
  ramUsedMb: number;
  diskUsedMb: number;
  activeServers: number;
  lastHeartbeat: string | null;
}

export interface ServerAllocation {
  id: string;
  serverId: string;
  nodeId: string;
  port: number;
  assignedAt: string;
}

export interface Server {
  id: string;
  name: string;
  identifier: string;
  description?: string;
  userId: string;
  nodeId: string | null;
  software: string;
  version: string;
  timezone: string;
  ramMb: number;
  cpuCores: number;
  storageMb: number;
  status: ServerStatus;
  subdomain: string;
  dnsConfigured: boolean;
  allocation?: ServerAllocation;
  playerCount: number;
  maxPlayers: number;
  uptimeSec: number;
  cpuUsagePct: number;
  ramUsedMb: number;
  diskUsedMb: number;
  installedPackages?: InstalledPackage[];
  backupSchedule?: BackupScheduleConfig;
  alertSettings?: ResourceAlertSettings;
  createdAt: string;
  updatedAt: string;
}

export interface InstalledPackage {
  id: string;
  packageId: string;
  name: string;
  slug: string;
  type: 'plugin' | 'mod';
  version: string;
  installedAt: string;
}

export interface BackupScheduleConfig {
  frequency: 'daily' | 'weekly' | 'custom' | 'off';
  retentionCount: number;
  lastRun?: string;
  nextRun?: string;
}

export interface ResourceAlertSettings {
  enabled: boolean;
  cpuThresholdPct: number;
  ramThresholdPct: number;
  diskThresholdPct: number;
  emailNotify: boolean;
  lastTriggered?: string;
}

export interface ResourceAlertEvent {
  id: string;
  serverId: string;
  metric: 'CPU' | 'RAM' | 'STORAGE';
  currentValue: number;
  thresholdValue: number;
  message: string;
  timestamp: string;
}

export interface ServerFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
  content?: string;
}

export interface ServerBackup {
  id: string;
  serverId: string;
  fileName: string;
  fileSizeMb: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  checksum: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  priceInr: number;
  priceCredits: number;
  ramMb: number;
  cpuCores: number;
  storageMb: number;
  backupLimit: number;
  serverLimit: number;
  description: string;
  active: boolean;
}

export interface CreditTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  source: string;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  creditValue: number;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'DISABLED';
  expiresAt: string | null;
  createdBy: string;
  redeemedBy: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

export interface PluginItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  testedVersions: string[];
  supportedLoaders: string[];
  installed?: boolean;
}

export interface ModItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  testedVersions: string[];
  supportedLoaders: string[];
  installed?: boolean;
}

export interface AuditLog {
  id: string;
  category: string;
  action: string;
  actorId: string | null;
  actorEmail?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  userId: string;
  planId?: string;
  amount: number;
  currency: 'INR' | 'USD' | 'CREDITS';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  provider: string;
  providerRef?: string;
  createdAt: string;
}
