// INFHOST Type Definitions

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

export type RedeemCodeStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'DISABLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type AuditCategory =
  | 'AUTH'
  | 'SERVER'
  | 'ADMIN'
  | 'NODE'
  | 'PAYMENT'
  | 'CREDITS';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  avatarUrl?: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Node {
  id: string;
  name: string;
  location: string; // e.g. "Germany", "Singapore", "India", "France", "United Kingdom", "Japan"
  region: string;   // "Europe" | "Asia"
  hostname: string;
  privateIp: string;
  publicIp: string;
  apiEndpoint: string;
  authToken: string;
  cpuCapacity: number;  // Cores
  ramCapacity: number;  // MB
  diskCapacity: number; // MB
  status: NodeStatus;
  lastHeartbeat: string | null;
  cpuUsagePct: number;
  ramUsedMb: number;
  diskUsedMb: number;
  activeServers: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerAllocation {
  id: string;
  serverId: string;
  nodeId: string;
  port: number; // Minecraft port 25565+
  assignedAt: string;
}

export interface Server {
  id: string;
  name: string;
  identifier: string; // Subdomain slug e.g. 'survival'
  description?: string;
  userId: string;
  nodeId: string | null;
  software: string; // Vanilla, Paper, Purpur, Spigot, Fabric, Forge, NeoForge
  version: string;  // "1.21.4"
  timezone: string; // "UTC", "Asia/Kolkata", "Europe/London", etc.
  ramMb: number;
  cpuCores: number;
  storageMb: number;
  status: ServerStatus;
  subdomain: string; // 'survival.infhost.net'
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

export interface CreditWallet {
  id: string;
  userId: string;
  balance: number; // Authoritative integer
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number; // +35 or -35
  balanceAfter: number;
  source: 'REDEEM_CODE' | 'PURCHASE' | 'HOURLY_SERVER_BILLING' | 'OFFER_REWARD' | 'ADMIN_ADJUSTMENT';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  creditValue: number;
  status: RedeemCodeStatus;
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
  category: AuditCategory;
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
  status: PaymentStatus;
  provider: string;
  providerRef?: string;
  createdAt: string;
}
