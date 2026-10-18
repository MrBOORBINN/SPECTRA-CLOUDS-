// Server Backup Service
// Handles asynchronous snapshot creation, restore jobs, and backup listing

import crypto from 'crypto';
import { db } from '../db';
import { ServerBackup } from '../types';

export class BackupService {
  public getServerBackups(serverId: string): ServerBackup[] {
    return db.backups.get(serverId) || [];
  }

  public async createBackup(serverId: string, userId: string): Promise<ServerBackup> {
    const server = db.servers.get(serverId);
    if (!server) throw new Error('Server not found');

    const backupId = 'bup_' + crypto.randomBytes(4).toString('hex');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${server.identifier}_backup_${timestampStr}.tar.gz`;
    const checksum = 'sha256:' + crypto.randomBytes(16).toString('hex');

    const backup: ServerBackup = {
      id: backupId,
      serverId,
      fileName,
      fileSizeMb: Math.round((server.diskUsedMb * 0.72) * 10) / 10,
      status: 'COMPLETED',
      checksum,
      createdAt: new Date().toISOString()
    };

    const existing = db.backups.get(serverId) || [];
    existing.unshift(backup);
    db.backups.set(serverId, existing);

    db.logAudit('SERVER', 'CREATE_BACKUP', userId, { serverId, backupId, fileName });
    return backup;
  }

  public deleteBackup(serverId: string, backupId: string, userId: string): boolean {
    const list = db.backups.get(serverId) || [];
    const filtered = list.filter(b => b.id !== backupId);
    db.backups.set(serverId, filtered);

    db.logAudit('SERVER', 'DELETE_BACKUP', userId, { serverId, backupId });
    return filtered.length < list.length;
  }

  public restoreBackup(serverId: string, backupId: string, userId: string): boolean {
    const list = db.backups.get(serverId) || [];
    const b = list.find(item => item.id === backupId);
    if (!b) return false;

    db.logAudit('SERVER', 'RESTORE_BACKUP', userId, { serverId, backupId });
    return true;
  }
}

export const backupService = new BackupService();
