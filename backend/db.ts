// INFHOST In-Memory & Persistent State Store
// Accurately implements the Prisma schema models

import crypto from 'crypto';
import {
  User,
  Session,
  Node,
  Server,
  ServerAllocation,
  ServerFile,
  ServerBackup,
  Plan,
  CreditWallet,
  CreditTransaction,
  RedeemCode,
  PluginItem,
  ModItem,
  AuditLog,
  Order,
  InstalledPackage,
  BackupScheduleConfig,
  ResourceAlertSettings,
  ResourceAlertEvent
} from './types';

export class DatabaseStore {
  public users: Map<string, User> = new Map();
  public sessions: Map<string, Session> = new Map();
  public nodes: Map<string, Node> = new Map();
  public servers: Map<string, Server> = new Map();
  public allocations: Map<string, ServerAllocation> = new Map();
  public files: Map<string, ServerFile[]> = new Map(); // serverId -> files
  public consoleLogs: Map<string, string[]> = new Map(); // serverId -> console log lines
  public backups: Map<string, ServerBackup[]> = new Map();
  public plans: Map<string, Plan> = new Map();
  public wallets: Map<string, CreditWallet> = new Map();
  public creditTransactions: Map<string, CreditTransaction[]> = new Map(); // walletId -> txs
  public redeemCodes: Map<string, RedeemCode> = new Map();
  public plugins: Map<string, PluginItem> = new Map();
  public mods: Map<string, ModItem> = new Map();
  public auditLogs: AuditLog[] = [];
  public orders: Map<string, Order> = new Map();
  public serverPackages: Map<string, InstalledPackage[]> = new Map();
  public backupSchedules: Map<string, BackupScheduleConfig> = new Map();
  public serverAlertSettings: Map<string, ResourceAlertSettings> = new Map();
  public serverAlertEvents: Map<string, ResourceAlertEvent[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private seedInitialData() {
    // 1. Initial Users (User from screenshot and Admin)
    const standardUser: User = {
      id: 'usr_user_1',
      email: 'infbuisness01@gmail.com',
      username: 'User',
      passwordHash: this.hashPassword('password123'),
      avatarUrl: undefined,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: '2025-09-24T10:00:00.000Z',
      updatedAt: '2025-09-24T10:00:00.000Z'
    };
    this.users.set(standardUser.id, standardUser);

    const adminUser: User = {
      id: 'usr_admin_1',
      email: 'admin@infhost.net',
      username: 'Admin',
      passwordHash: this.hashPassword('admin123'),
      avatarUrl: undefined,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2025-09-01T08:00:00.000Z',
      updatedAt: '2025-09-01T08:00:00.000Z'
    };
    this.users.set(adminUser.id, adminUser);

    // 2. Wallets (Authoritative credit store)
    const userWallet: CreditWallet = {
      id: 'wal_user_1',
      userId: standardUser.id,
      balance: 2500,
      updatedAt: new Date().toISOString()
    };
    this.wallets.set(userWallet.id, userWallet);
    this.creditTransactions.set(userWallet.id, [
      {
        id: 'tx_init_1',
        walletId: userWallet.id,
        userId: standardUser.id,
        amount: 2500,
        balanceAfter: 2500,
        source: 'REDEEM_CODE',
        description: 'INFHOST Verified Starter Credits Package',
        referenceId: 'INFHOST-INIT-2500',
        createdAt: '2025-09-24T10:05:00.000Z'
      }
    ]);

    const adminWallet: CreditWallet = {
      id: 'wal_admin_1',
      userId: adminUser.id,
      balance: 10000,
      updatedAt: new Date().toISOString()
    };
    this.wallets.set(adminWallet.id, adminWallet);
    this.creditTransactions.set(adminWallet.id, []);

    // 3. Plans (Dirt 390, Stone 690, Copper 1190, Iron 1690, Gold 2490, Emerald 3990)
    const plansList: Plan[] = [
      {
        id: 'plan_dirt',
        name: 'Dirt',
        slug: 'dirt',
        priceInr: 39,
        priceCredits: 390,
        ramMb: 2048,
        cpuCores: 1,
        storageMb: 10240,
        backupLimit: 2,
        serverLimit: 1,
        description: 'Starter tier for lightweight vanilla survival and testing.',
        active: true
      },
      {
        id: 'plan_stone',
        name: 'Stone',
        slug: 'stone',
        priceInr: 69,
        priceCredits: 690,
        ramMb: 4096,
        cpuCores: 2,
        storageMb: 25600,
        backupLimit: 3,
        serverLimit: 1,
        description: 'Reliable tier for small multiplayer survival worlds with Paper.',
        active: true
      },
      {
        id: 'plan_copper',
        name: 'Copper',
        slug: 'copper',
        priceInr: 119,
        priceCredits: 1190,
        ramMb: 6144,
        cpuCores: 3,
        storageMb: 40960,
        backupLimit: 5,
        serverLimit: 2,
        description: 'Balanced performance for Purpur servers and basic plugin setups.',
        active: true
      },
      {
        id: 'plan_iron',
        name: 'Iron',
        slug: 'iron',
        priceInr: 169,
        priceCredits: 1690,
        ramMb: 8192,
        cpuCores: 4,
        storageMb: 61440,
        backupLimit: 7,
        serverLimit: 3,
        description: 'High performance for populated survival servers and modded gameplay.',
        active: true
      },
      {
        id: 'plan_gold',
        name: 'Gold',
        slug: 'gold',
        priceInr: 249,
        priceCredits: 2490,
        ramMb: 12288,
        cpuCores: 6,
        storageMb: 102400,
        backupLimit: 10,
        serverLimit: 4,
        description: 'Premium tier for heavy modpacks, minigame hubs, and large networks.',
        active: true
      },
      {
        id: 'plan_emerald',
        name: 'Emerald',
        slug: 'emerald',
        priceInr: 399,
        priceCredits: 3990,
        ramMb: 16384,
        cpuCores: 8,
        storageMb: 153600,
        backupLimit: 15,
        serverLimit: 5,
        description: 'Ultimate dedicated infrastructure for high-tick communities and esports.',
        active: true
      }
    ];
    for (const p of plansList) {
      this.plans.set(p.id, p);
    }

    // 4. Redeem Codes (Format: INFHOST-XXXX-XXXX)
    const codesList: RedeemCode[] = [
      {
        id: 'code_dirt',
        code: 'INFHOST-DIRT-0390',
        creditValue: 390,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      },
      {
        id: 'code_stone',
        code: 'INFHOST-STON-0690',
        creditValue: 690,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      },
      {
        id: 'code_copper',
        code: 'INFHOST-COPP-1190',
        creditValue: 1190,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      },
      {
        id: 'code_iron',
        code: 'INFHOST-IRON-1690',
        creditValue: 1690,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      },
      {
        id: 'code_gold',
        code: 'INFHOST-GOLD-2490',
        creditValue: 2490,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      },
      {
        id: 'code_emerald',
        code: 'INFHOST-EMER-3990',
        creditValue: 3990,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      },
      {
        id: 'code_free',
        code: 'INFHOST-FREE-1000',
        creditValue: 1000,
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59.000Z',
        createdBy: 'SYSTEM',
        redeemedBy: null,
        redeemedAt: null,
        createdAt: '2025-09-01T00:00:00.000Z'
      }
    ];
    for (const c of codesList) {
      this.redeemCodes.set(c.code, c);
    }

    // 5. Plugins Library
    const pluginData: PluginItem[] = [
      {
        id: 'pl_essx',
        name: 'EssentialsX',
        slug: 'essentialsx',
        description: 'The essential plugin suite for Minecraft servers providing core commands, economy, teleportation, and player management.',
        category: 'Administration',
        author: 'EssentialsX Team',
        downloads: 2450000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot']
      },
      {
        id: 'pl_luckperms',
        name: 'LuckPerms',
        slug: 'luckperms',
        description: 'An advanced permissions management plugin with web editor, high performance, and granular permissions calculation.',
        category: 'Administration',
        author: 'Luck',
        downloads: 3890000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot', 'Fabric', 'Forge']
      },
      {
        id: 'pl_vault',
        name: 'Vault',
        slug: 'vault',
        description: 'Universal permissions, chat, & economy API abstraction bridge for modern plugins.',
        category: 'Economy',
        author: 'Kihira & Sleaker',
        downloads: 4100000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot']
      },
      {
        id: 'pl_worldedit',
        name: 'WorldEdit',
        slug: 'worldedit',
        description: 'In-game Minecraft map editor. Fast block manipulation, custom brushes, selections, and schematics.',
        category: 'World Management',
        author: 'EngineHub',
        downloads: 5200000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot', 'Fabric', 'Forge']
      },
      {
        id: 'pl_chunky',
        name: 'Chunky',
        slug: 'chunky',
        description: 'Pre-generates chunks rapidly to completely eliminate exploration lag on active servers.',
        category: 'Performance',
        author: 'pop4959',
        downloads: 870000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot', 'Fabric', 'Forge']
      },
      {
        id: 'pl_spark',
        name: 'spark',
        slug: 'spark',
        description: 'Performance profiling plugin and mod for analyzing lag, CPU/memory usage, and tick anomalies.',
        category: 'Performance',
        author: 'lucko',
        downloads: 1650000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot', 'Fabric', 'Forge', 'NeoForge']
      },
      {
        id: 'pl_geyser',
        name: 'GeyserMC',
        slug: 'geysermc',
        description: 'Allows Minecraft Bedrock Edition players (mobile, console, Windows) to join Java Edition servers seamlessly.',
        category: 'Networking',
        author: 'GeyserMC',
        downloads: 2100000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4'],
        supportedLoaders: ['Paper', 'Purpur', 'Spigot', 'Fabric']
      }
    ];
    for (const p of pluginData) {
      this.plugins.set(p.id, p);
    }

    // 6. Mods Library
    const modData: ModItem[] = [
      {
        id: 'mod_sodium',
        name: 'Sodium',
        slug: 'sodium',
        description: 'Modern rendering engine and performance optimization mod for Minecraft client and server.',
        category: 'Optimization',
        author: 'jellysquid3 / CaffeineMC',
        downloads: 28000000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1'],
        supportedLoaders: ['Fabric', 'NeoForge']
      },
      {
        id: 'mod_lithium',
        name: 'Lithium',
        slug: 'lithium',
        description: 'General-purpose optimization mod for Minecraft physics, mob AI, chunk loading, and block ticking.',
        category: 'Optimization',
        author: 'jellysquid3 / CaffeineMC',
        downloads: 22000000,
        testedVersions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1'],
        supportedLoaders: ['Fabric', 'NeoForge']
      },
      {
        id: 'mod_ferritecore',
        name: 'FerriteCore',
        slug: 'ferritecore',
        description: 'Memory usage optimizations reducing RAM footprint by up to 40% on modded servers.',
        category: 'Optimization',
        author: 'malte0811',
        downloads: 14000000,
        testedVersions: ['1.21.1', '1.20.1', '1.19.2', '1.18.2'],
        supportedLoaders: ['Fabric', 'Forge', 'NeoForge']
      }
    ];
    for (const m of modData) {
      this.mods.set(m.id, m);
    }

    // Notice: nodes Map is intentionally kept empty or initially with NO NODE.
    // If a node is added via Admin Panel or Node Agent registration, it gets populated.
    // This rigorously obeys: "If a real node is not connected, clearly show: NO NODE CONNECTED. Do not pretend the server is online."
  }

  // Audit Log helper
  public logAudit(category: AuditLog['category'], action: string, actorId: string | null, details: Record<string, unknown>, ipAddress?: string) {
    const log: AuditLog = {
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      category,
      action,
      actorId,
      actorEmail: actorId ? this.users.get(actorId)?.email : undefined,
      details: JSON.stringify(details),
      ipAddress: ipAddress || '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }
}

export const db = new DatabaseStore();
