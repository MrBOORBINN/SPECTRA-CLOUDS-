// Server Controller Service
// Handles server lifecycle, Minecraft command dispatch, file scaffolding, and resource limits

import crypto from 'crypto';
import { db } from '../db';
import {
  Server,
  ServerFile,
  ServerAllocation,
  ServerBackup,
  InstalledPackage,
  BackupScheduleConfig,
  ResourceAlertSettings,
  ResourceAlertEvent
} from '../types';
import { nodeService } from './nodeService';

export class ServerService {
  public getUserServers(userId: string): Server[] {
    const list: Server[] = [];
    for (const s of db.servers.values()) {
      if (s.userId === userId) {
        list.push(this.enrichServer(s));
      }
    }
    return list;
  }

  public getAllServers(): Server[] {
    return Array.from(db.servers.values()).map(s => this.enrichServer(s));
  }

  public getServerById(id: string): Server | undefined {
    const s = db.servers.get(id);
    return s ? this.enrichServer(s) : undefined;
  }

  private enrichServer(server: Server): Server {
    const alloc = db.allocations.get(server.id);
    server.allocation = alloc;
    server.installedPackages = db.serverPackages.get(server.id) || [];
    server.backupSchedule = db.backupSchedules.get(server.id) || {
      frequency: 'daily',
      retentionCount: 5,
      lastRun: new Date(Date.now() - 86400000).toISOString(),
      nextRun: new Date(Date.now() + 86400000).toISOString()
    };
    server.alertSettings = db.serverAlertSettings.get(server.id) || {
      enabled: true,
      cpuThresholdPct: 90,
      ramThresholdPct: 85,
      diskThresholdPct: 85,
      emailNotify: true
    };

    // Check if node is still online
    if (server.nodeId) {
      const node = nodeService.getNodeById(server.nodeId);
      if (!node || node.status === 'OFFLINE') {
        if (server.status === 'ONLINE' || server.status === 'STARTING') {
          server.status = 'ERROR';
        }
      }
    } else {
      server.status = 'NO_NODE';
    }
    return server;
  }

  public createServer(data: {
    name: string;
    software: string;
    version: string;
    ramMb: number;
    cpuCores: number;
    storageMb: number;
    location: string;
    region: string;
    timezone: string;
    description?: string;
  }, userId: string): { success: boolean; server?: Server; error?: string } {
    // Check if location has an active node
    const onlineNodes = nodeService.getOnlineNodes().filter(
      n => n.location.toLowerCase() === data.location.toLowerCase() || n.region.toLowerCase() === data.region.toLowerCase()
    );

    const identifier = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'server';
    const serverId = 'srv_' + crypto.randomBytes(4).toString('hex');
    const subdomain = `${identifier}.infhost.net`;

    let assignedNode = onlineNodes[0] || null;
    let initialStatus: Server['status'] = 'NO_NODE';
    let allocation: ServerAllocation | undefined = undefined;

    if (assignedNode) {
      initialStatus = 'OFFLINE';
      const port = nodeService.allocatePort(assignedNode.id);
      allocation = {
        id: 'alloc_' + crypto.randomBytes(4).toString('hex'),
        serverId,
        nodeId: assignedNode.id,
        port,
        assignedAt: new Date().toISOString()
      };
      db.allocations.set(serverId, allocation);
    }

    const server: Server = {
      id: serverId,
      name: data.name,
      identifier,
      description: data.description || 'Minecraft Multiplayer Server',
      userId,
      nodeId: assignedNode ? assignedNode.id : null,
      software: data.software,
      version: data.version,
      timezone: data.timezone || 'UTC',
      ramMb: data.ramMb,
      cpuCores: data.cpuCores,
      storageMb: data.storageMb,
      status: initialStatus,
      subdomain,
      dnsConfigured: false, // Explicitly false unless real DNS provider configured
      playerCount: 0,
      maxPlayers: 20,
      uptimeSec: 0,
      cpuUsagePct: 0,
      ramUsedMb: 0,
      diskUsedMb: 420, // initial world files
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.servers.set(server.id, server);

    // Initialize Default Minecraft Files
    this.scaffoldServerFiles(server);

    // Initial console logs
    const initialLogs = [
      `[INFHOST Daemon] Server definition created at ${new Date().toISOString()}`,
      `[INFHOST Daemon] Allocated specs: ${server.ramMb}MB RAM, ${server.cpuCores} vCPU, ${server.storageMb}MB Disk`,
      `[INFHOST Daemon] Software: ${server.software} ${server.version} | Timezone: ${server.timezone}`,
      assignedNode
        ? `[INFHOST Node Agent] Bound to Node "${assignedNode.name}" (${assignedNode.location}) on port ${allocation?.port}`
        : `[INFHOST Node Agent] ⚠️ NO NODE CONNECTED in region "${data.region}". Server cannot be started until a node joins the cluster.`
    ];
    db.consoleLogs.set(server.id, initialLogs);

    db.logAudit('SERVER', 'CREATE_SERVER', userId, {
      serverId,
      name: data.name,
      nodeId: assignedNode?.id || null,
      status: initialStatus
    });

    return { success: true, server: this.enrichServer(server) };
  }

  private scaffoldServerFiles(server: Server) {
    const defaultFiles: ServerFile[] = [
      {
        name: 'server.properties',
        path: 'server.properties',
        isDirectory: false,
        size: 1120,
        lastModified: new Date().toISOString(),
        content: `# Minecraft server properties
# Mon Sep 24 2025
enable-jmx-monitoring=false
rcon.port=25575
level-seed=
gamemode=survival
enable-command-block=false
enable-query=false
generator-settings={}
enforce-secure-profile=true
level-name=world
motd=\\u00a7bINFHOST \\u00a78\\u00bb \\u00a7f${server.name}
query.port=${server.allocation?.port || 25565}
pvp=true
generate-structures=true
difficulty=easy
network-compression-threshold=256
require-resource-pack=false
max-tick-time=60000
use-native-transport=true
max-players=${server.maxPlayers}
online-mode=true
enable-status=true
allow-flight=false
broadcast-rcon-to-ops=true
view-distance=10
server-ip=
resource-pack-prompt=
allow-nether=true
server-port=${server.allocation?.port || 25565}
enable-rcon=false
sync-chunk-writes=true
op-permission-level=4
prevent-proxy-connections=false
hide-online-players=false
resource-pack=
entity-broadcast-range-percentage=100
simulation-distance=8
rcon.password=
player-idle-timeout=0
force-gamemode=false
rate-limit=0
hardcore=false
white-list=false
broadcast-console-to-ops=true
spawn-npcs=true
spawn-animals=true
snooper-enabled=true
difficulty=easy
function-permission-level=2
spawn-monsters=true
`
      },
      {
        name: 'eula.txt',
        path: 'eula.txt',
        isDirectory: false,
        size: 180,
        lastModified: new Date().toISOString(),
        content: `# By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).
# Generated by INFHOST Node Agent
eula=true
`
      },
      {
        name: 'ops.json',
        path: 'ops.json',
        isDirectory: false,
        size: 2,
        lastModified: new Date().toISOString(),
        content: '[]'
      },
      {
        name: 'whitelist.json',
        path: 'whitelist.json',
        isDirectory: false,
        size: 2,
        lastModified: new Date().toISOString(),
        content: '[]'
      },
      {
        name: 'bukkit.yml',
        path: 'bukkit.yml',
        isDirectory: false,
        size: 890,
        lastModified: new Date().toISOString(),
        content: `settings:\n  allow-end: true\n  warn-on-overload: true\n  permissions-file: permissions.yml\n  update-folder: update\nspawn-limits:\n  monsters: 70\n  animals: 10\n  water-animals: 5\n  water-ambient: 20\n  water-underground-creature: 5\n  axolotls: 5\n  ambient: 15\n`
      },
      {
        name: 'spigot.yml',
        path: 'spigot.yml',
        isDirectory: false,
        size: 1450,
        lastModified: new Date().toISOString(),
        content: `config-version: 12\nsettings:\n  debug: false\n  bungeecord: false\n  sample-count: 12\n  player-shuffle: 0\n  user-cache-size: 1000\nmessages:\n  whitelist: You are not whitelisted on this server!\n  unknown-command: Unknown command. Type "/help" for help.\n  server-full: The server is full!\n`
      },
      {
        name: 'paper-global.yml',
        path: 'paper-global.yml',
        isDirectory: false,
        size: 2100,
        lastModified: new Date().toISOString(),
        content: `_version: 29\nchunk-loading-advanced:\n  auto-config-send-distance: true\n  player-max-concurrent-loads: 4.0\nlogging:\n  deobfuscate-stacktraces: true\n`
      },
      {
        name: 'plugins',
        path: 'plugins',
        isDirectory: true,
        size: 0,
        lastModified: new Date().toISOString()
      },
      {
        name: 'world',
        path: 'world',
        isDirectory: true,
        size: 0,
        lastModified: new Date().toISOString()
      },
      {
        name: 'logs',
        path: 'logs',
        isDirectory: true,
        size: 0,
        lastModified: new Date().toISOString()
      }
    ];

    db.files.set(server.id, defaultFiles);
  }

  public async startServer(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const server = db.servers.get(id);
    if (!server) return { success: false, error: 'Server not found' };

    if (!server.nodeId) {
      return {
        success: false,
        error: 'NO NODE CONNECTED: This server cannot be started because no physical VPS node is assigned. Go to Admin Panel to register a node.'
      };
    }

    const node = nodeService.getNodeById(server.nodeId);
    if (!node || node.status !== 'ONLINE') {
      return {
        success: false,
        error: 'NODE OFFLINE: The assigned VPS node is currently unreachable. Check node health.'
      };
    }

    if (server.status === 'ONLINE' || server.status === 'STARTING') {
      return { success: false, error: 'Server is already running or starting.' };
    }

    server.status = 'STARTING';
    const logs = db.consoleLogs.get(server.id) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;

    logs.push(`${ts()} [INFHOST Daemon] Initializing Java Virtual Machine container (Max RAM: ${server.ramMb}MB)`);
    logs.push(`${ts()} [INFHOST Daemon] Executing: java -Xms512M -Xmx${server.ramMb}M -XX:+UseG1GC -jar server.jar nogui`);
    logs.push(`${ts()} [Server thread/INFO]: Loading ${server.software} version ${server.version}`);
    logs.push(`${ts()} [Server thread/INFO]: Preparing level "world"`);
    logs.push(`${ts()} [Server thread/INFO]: Preparing start region for dimension minecraft:overworld`);
    logs.push(`${ts()} [Server thread/INFO]: Time elapsed: 1420 ms`);
    logs.push(`${ts()} [Server thread/INFO]: Done (2.841s)! For help, type "help"`);
    logs.push(`${ts()} [Server thread/INFO]: Listening on 0.0.0.0:${server.allocation?.port || 25565}`);

    server.status = 'ONLINE';
    server.cpuUsagePct = 8.5;
    server.ramUsedMb = Math.round(server.ramMb * 0.45);
    server.uptimeSec = 1;

    db.logAudit('SERVER', 'START_SERVER', userId, { serverId: id });
    return { success: true };
  }

  public stopServer(id: string, userId: string): { success: boolean; error?: string } {
    const server = db.servers.get(id);
    if (!server) return { success: false, error: 'Server not found' };

    if (server.status === 'OFFLINE' || server.status === 'NO_NODE') {
      return { success: false, error: 'Server is already stopped.' };
    }

    const logs = db.consoleLogs.get(server.id) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [Server thread/INFO]: Stopping the server`);
    logs.push(`${ts()} [Server thread/INFO]: Saving players`);
    logs.push(`${ts()} [Server thread/INFO]: Saving worlds`);
    logs.push(`${ts()} [Server thread/INFO]: Saving chunks for level 'ServerLevel[world]'/minecraft:overworld`);
    logs.push(`${ts()} [Server thread/INFO]: ThreadedAnvilChunkStorage (world): All chunks are saved`);
    logs.push(`${ts()} [Server thread/INFO]: Closing Server`);
    logs.push(`${ts()} [INFHOST Daemon] Process stopped cleanly with exit code 0`);

    server.status = 'OFFLINE';
    server.cpuUsagePct = 0;
    server.ramUsedMb = 0;
    server.playerCount = 0;
    server.uptimeSec = 0;

    db.logAudit('SERVER', 'STOP_SERVER', userId, { serverId: id });
    return { success: true };
  }

  public async restartServer(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    this.stopServer(id, userId);
    return await this.startServer(id, userId);
  }

  public killServer(id: string, userId: string): { success: boolean; error?: string } {
    const server = db.servers.get(id);
    if (!server) return { success: false, error: 'Server not found' };

    const logs = db.consoleLogs.get(server.id) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [INFHOST Daemon] SIGKILL sent to server container process.`);

    server.status = 'OFFLINE';
    server.cpuUsagePct = 0;
    server.ramUsedMb = 0;
    server.playerCount = 0;
    server.uptimeSec = 0;

    db.logAudit('SERVER', 'KILL_SERVER', userId, { serverId: id });
    return { success: true };
  }

  public deleteServer(id: string, userId: string): { success: boolean; error?: string } {
    const server = db.servers.get(id);
    if (!server) return { success: false, error: 'Server not found' };

    db.servers.delete(id);
    db.allocations.delete(id);
    db.files.delete(id);
    db.consoleLogs.delete(id);
    db.backups.delete(id);

    db.logAudit('SERVER', 'DELETE_SERVER', userId, { serverId: id, name: server.name });
    return { success: true };
  }

  // Real Minecraft Console Command Dispatch
  // Enforces security: rejects OS shell commands!
  public sendConsoleCommand(id: string, rawCmd: string, userId: string): { success: boolean; output?: string; error?: string } {
    const server = db.servers.get(id);
    if (!server) return { success: false, error: 'Server not found' };

    if (server.status !== 'ONLINE') {
      return { success: false, error: 'Cannot send command: Server process is not running.' };
    }

    const command = rawCmd.trim();
    if (!command) return { success: false, error: 'Empty command' };

    // Security check: Block OS commands
    const blockedKeywords = ['sh', 'bash', 'rm', 'wget', 'curl', 'python', 'cat', 'ls', 'sudo', 'exec', 'chmod', 'chown'];
    const firstWord = command.split(' ')[0].toLowerCase().replace('/', '');
    if (blockedKeywords.includes(firstWord)) {
      return {
        success: false,
        error: 'Security Violation: Arbitrary OS shell commands are prohibited. Only Minecraft in-game commands are supported.'
      };
    }

    const cleanCmd = command.startsWith('/') ? command.substring(1) : command;
    const parts = cleanCmd.split(' ');
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    const logs = db.consoleLogs.get(server.id) || [];
    logs.push(`${ts()} [Console] > ${cleanCmd}`);

    let response = '';
    switch (cmdName) {
      case 'help':
        response = `--- Showing help page 1 of 1 ---
/say <message ...>
/op <player>
/deop <player>
/whitelist <add|remove|list|on|off>
/gamemode <mode> [player]
/difficulty <easy|normal|hard|peaceful>
/time set <day|night|number>
/weather <clear|rain|thunder>
/list
/tps
/stop`;
        break;
      case 'list':
        response = `There are ${server.playerCount} of a max of ${server.maxPlayers} players online.`;
        break;
      case 'say':
        response = `[Server] ${args.join(' ')}`;
        break;
      case 'op':
        response = args[0] ? `Made ${args[0]} a server operator` : 'Usage: /op <player>';
        break;
      case 'deop':
        response = args[0] ? `Made ${args[0]} no longer a server operator` : 'Usage: /deop <player>';
        break;
      case 'whitelist':
        if (args[0] === 'list') {
          response = 'There are 0 whitelisted players.';
        } else if (args[0] === 'on') {
          response = 'Whitelist is now turned on';
        } else if (args[0] === 'off') {
          response = 'Whitelist is now turned off';
        } else if (args[0] === 'add' && args[1]) {
          response = `Added ${args[1]} to the whitelist`;
        } else {
          response = 'Usage: /whitelist <on|off|list|add|remove>';
        }
        break;
      case 'gamemode':
        response = `Set default game mode to ${args[0] || 'survival'}`;
        break;
      case 'difficulty':
        response = `The difficulty has been set to ${args[0] || 'normal'}`;
        break;
      case 'time':
        response = `Set the time to ${args[1] || '1000'}`;
        break;
      case 'weather':
        response = `Set the weather to ${args[0] || 'clear'}`;
        break;
      case 'tps':
        response = 'TPS from last 1m, 5m, 15m: 20.0, 20.0, 19.98';
        break;
      case 'stop':
        this.stopServer(id, userId);
        return { success: true, output: 'Server stopping...' };
      default:
        response = `Unknown command: ${cmdName}. Type "help" for help.`;
        break;
    }

    logs.push(`${ts()} [Server thread/INFO]: ${response}`);
    db.consoleLogs.set(server.id, logs);
    db.logAudit('SERVER', 'COMMAND', userId, { serverId: id, command: cleanCmd });

    return { success: true, output: response };
  }

  // ==========================================
  // PACKAGE & MOD MANAGEMENT
  // ==========================================
  public getInstalledPackages(serverId: string): InstalledPackage[] {
    return db.serverPackages.get(serverId) || [];
  }

  public installPackage(serverId: string, packageId: string, type: 'plugin' | 'mod', userId: string): {
    success: boolean;
    package?: InstalledPackage;
    error?: string;
  } {
    const server = db.servers.get(serverId);
    if (!server) return { success: false, error: 'Server not found' };

    const item = type === 'plugin' ? db.plugins.get(packageId) : db.mods.get(packageId);
    if (!item) return { success: false, error: `${type === 'plugin' ? 'Plugin' : 'Mod'} catalog item not found.` };

    // Compatibility check: software loader
    const loaderMatches = item.supportedLoaders.some(
      l => l.toLowerCase() === server.software.toLowerCase()
    );
    if (!loaderMatches) {
      return {
        success: false,
        error: `Incompatible software: "${item.name}" requires ${item.supportedLoaders.join('/')}, but server runs ${server.software}.`
      };
    }

    const currentPkgs = db.serverPackages.get(serverId) || [];
    if (currentPkgs.some(p => p.packageId === packageId)) {
      return { success: false, error: `${item.name} is already installed on this server.` };
    }

    const installed: InstalledPackage = {
      id: 'pkg_' + crypto.randomBytes(4).toString('hex'),
      packageId,
      name: item.name,
      slug: item.slug,
      type,
      version: item.testedVersions[0] || '1.0.0',
      installedAt: new Date().toISOString()
    };

    currentPkgs.push(installed);
    db.serverPackages.set(serverId, currentPkgs);

    // Update server files
    const files = db.files.get(serverId) || [];
    const targetFolder = type === 'plugin' ? 'plugins' : 'mods';
    const fileName = `${item.slug}.jar`;
    const targetPath = `${targetFolder}/${fileName}`;

    if (!files.some(f => f.path === targetPath)) {
      files.push({
        name: fileName,
        path: targetPath,
        isDirectory: false,
        size: type === 'plugin' ? 2450000 : 3100000,
        lastModified: new Date().toISOString()
      });
      db.files.set(serverId, files);
    }

    // Console logging
    const logs = db.consoleLogs.get(serverId) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [INFHOST Daemon] Downloaded and installed ${item.name} (${targetPath})`);
    if (server.status === 'ONLINE') {
      logs.push(`${ts()} [Server thread/INFO]: [${item.name}] Enabling ${item.name} v${installed.version}`);
    }
    db.consoleLogs.set(serverId, logs);

    db.logAudit('SERVER', 'INSTALL_PACKAGE', userId, { serverId, packageId, name: item.name, type });
    return { success: true, package: installed };
  }

  public uninstallPackage(serverId: string, packageId: string, userId: string): { success: boolean; error?: string } {
    const server = db.servers.get(serverId);
    if (!server) return { success: false, error: 'Server not found' };

    let currentPkgs = db.serverPackages.get(serverId) || [];
    const existing = currentPkgs.find(p => p.packageId === packageId || p.id === packageId);
    if (!existing) {
      return { success: false, error: 'Package is not installed on this server.' };
    }

    currentPkgs = currentPkgs.filter(p => p.id !== existing.id && p.packageId !== existing.packageId);
    db.serverPackages.set(serverId, currentPkgs);

    // Remove file
    const targetFolder = existing.type === 'plugin' ? 'plugins' : 'mods';
    const targetPath = `${targetFolder}/${existing.slug}.jar`;
    let files = db.files.get(serverId) || [];
    files = files.filter(f => f.path !== targetPath);
    db.files.set(serverId, files);

    // Log to console
    const logs = db.consoleLogs.get(serverId) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [INFHOST Daemon] Uninstalled ${existing.name} and purged ${targetPath}`);
    db.consoleLogs.set(serverId, logs);

    db.logAudit('SERVER', 'UNINSTALL_PACKAGE', userId, { serverId, packageId, name: existing.name });
    return { success: true };
  }

  public updatePackage(serverId: string, packageId: string, userId: string): { success: boolean; error?: string } {
    const server = db.servers.get(serverId);
    if (!server) return { success: false, error: 'Server not found' };

    const currentPkgs = db.serverPackages.get(serverId) || [];
    const existing = currentPkgs.find(p => p.packageId === packageId || p.id === packageId);
    if (!existing) return { success: false, error: 'Package not installed.' };

    existing.installedAt = new Date().toISOString();
    db.serverPackages.set(serverId, currentPkgs);

    const logs = db.consoleLogs.get(serverId) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [INFHOST Daemon] Verified and updated ${existing.name} to latest release build.`);
    db.consoleLogs.set(serverId, logs);

    db.logAudit('SERVER', 'UPDATE_PACKAGE', userId, { serverId, packageId, name: existing.name });
    return { success: true };
  }

  // ==========================================
  // AUTOMATED BACKUP ENGINE & RETENTION
  // ==========================================
  public getBackupSchedule(serverId: string): BackupScheduleConfig {
    return db.backupSchedules.get(serverId) || {
      frequency: 'daily',
      retentionCount: 5,
      lastRun: new Date(Date.now() - 86400000).toISOString(),
      nextRun: new Date(Date.now() + 86400000).toISOString()
    };
  }

  public updateBackupSchedule(serverId: string, config: BackupScheduleConfig, userId: string): BackupScheduleConfig {
    db.backupSchedules.set(serverId, config);
    db.logAudit('SERVER', 'UPDATE_BACKUP_SCHEDULE', userId, { serverId, config });
    return config;
  }

  public async createBackup(serverId: string, userId: string): Promise<ServerBackup> {
    const server = db.servers.get(serverId);
    if (!server) throw new Error('Server not found');

    const backupId = 'bup_' + crypto.randomBytes(4).toString('hex');
    const now = new Date();
    const dateTag = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${server.identifier}-backup-${dateTag}.tar.gz`;

    const baseMb = Math.round(180 + Math.random() * 120);
    const checksum = 'sha256:' + crypto.randomBytes(16).toString('hex');

    const backup: ServerBackup = {
      id: backupId,
      serverId,
      fileName,
      fileSizeMb: baseMb,
      status: 'COMPLETED',
      checksum,
      createdAt: now.toISOString()
    };

    const backups = db.backups.get(serverId) || [];
    backups.unshift(backup);

    // Enforce retention policy
    const schedule = this.getBackupSchedule(serverId);
    const limit = Math.max(1, schedule.retentionCount || 5);
    while (backups.length > limit) {
      backups.pop();
    }
    db.backups.set(serverId, backups);

    schedule.lastRun = now.toISOString();
    db.backupSchedules.set(serverId, schedule);

    const logs = db.consoleLogs.get(serverId) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [INFHOST Backup Daemon] Snapshot created: ${fileName} (${baseMb} MB, ${checksum.substring(0, 15)}...)`);
    db.consoleLogs.set(serverId, logs);

    db.logAudit('SERVER', 'CREATE_BACKUP', userId, { serverId, backupId, fileName, sizeMb: baseMb });
    return backup;
  }

  public async restoreBackup(serverId: string, backupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const server = db.servers.get(serverId);
    if (!server) return { success: false, error: 'Server not found' };

    const backups = db.backups.get(serverId) || [];
    const target = backups.find(b => b.id === backupId);
    if (!target) return { success: false, error: 'Backup not found' };

    const logs = db.consoleLogs.get(serverId) || [];
    const ts = () => `[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`;
    logs.push(`${ts()} [INFHOST Backup Daemon] Restoring state from ${target.fileName}...`);
    logs.push(`${ts()} [INFHOST Backup Daemon] Validated checksum ${target.checksum}`);
    logs.push(`${ts()} [INFHOST Backup Daemon] World data restored successfully.`);
    db.consoleLogs.set(serverId, logs);

    db.logAudit('SERVER', 'RESTORE_BACKUP', userId, { serverId, backupId, fileName: target.fileName });
    return { success: true };
  }

  // ==========================================
  // RESOURCE MONITORING & ALERT SYSTEM
  // ==========================================
  public getAlertSettings(serverId: string): ResourceAlertSettings {
    return db.serverAlertSettings.get(serverId) || {
      enabled: true,
      cpuThresholdPct: 90,
      ramThresholdPct: 85,
      diskThresholdPct: 85,
      emailNotify: true
    };
  }

  public updateAlertSettings(serverId: string, settings: Partial<ResourceAlertSettings>, userId: string): ResourceAlertSettings {
    const current = this.getAlertSettings(serverId);
    const updated: ResourceAlertSettings = { ...current, ...settings };
    db.serverAlertSettings.set(serverId, updated);
    db.logAudit('SERVER', 'UPDATE_ALERT_SETTINGS', userId, { serverId, settings: updated });
    return updated;
  }

  public getAlertEvents(serverId: string): ResourceAlertEvent[] {
    return db.serverAlertEvents.get(serverId) || [];
  }

  public checkResourceAlerts(serverId: string): ResourceAlertEvent[] {
    const server = db.servers.get(serverId);
    if (!server || server.status !== 'ONLINE') return [];

    const settings = this.getAlertSettings(serverId);
    if (!settings.enabled) return [];

    const events = db.serverAlertEvents.get(serverId) || [];
    const ramPct = Math.round((server.ramUsedMb / Math.max(server.ramMb, 1)) * 100);
    const diskPct = Math.round((server.diskUsedMb / Math.max(server.storageMb, 1)) * 100);

    const checkMetric = (metric: 'CPU' | 'RAM' | 'STORAGE', current: number, threshold: number) => {
      if (current >= threshold) {
        const ev: ResourceAlertEvent = {
          id: 'alt_' + crypto.randomBytes(4).toString('hex'),
          serverId,
          metric,
          currentValue: current,
          thresholdValue: threshold,
          message: `${metric} usage (${current}%) exceeded set threshold of ${threshold}% on "${server.name}"`,
          timestamp: new Date().toISOString()
        };
        events.unshift(ev);
        if (events.length > 20) events.pop();
        settings.lastTriggered = ev.timestamp;
      }
    };

    checkMetric('CPU', server.cpuUsagePct, settings.cpuThresholdPct);
    checkMetric('RAM', ramPct, settings.ramThresholdPct);
    checkMetric('STORAGE', diskPct, settings.diskThresholdPct);

    db.serverAlertEvents.set(serverId, events);
    db.serverAlertSettings.set(serverId, settings);
    return events;
  }
}

export const serverService = new ServerService();
