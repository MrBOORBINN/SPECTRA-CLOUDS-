// File Manager Service
// Handles server file operations through authenticated backend API

import { db } from '../db';
import { ServerFile } from '../types';

export class FileService {
  public getFiles(serverId: string, folderPath: string = ''): ServerFile[] {
    const files = db.files.get(serverId) || [];
    const normalizedFolder = folderPath ? (folderPath.endsWith('/') ? folderPath : folderPath + '/') : '';

    return files.filter(f => {
      if (normalizedFolder === '') {
        return !f.path.includes('/') || f.path.indexOf('/') === f.path.length - 1;
      }
      return f.path.startsWith(normalizedFolder) && f.path !== normalizedFolder;
    });
  }

  public getFileContent(serverId: string, filePath: string): { content: string; name: string } | null {
    const files = db.files.get(serverId) || [];
    const file = files.find(f => f.path === filePath && !f.isDirectory);
    if (!file) return null;
    return { content: file.content || '', name: file.name };
  }

  public saveFileContent(serverId: string, filePath: string, content: string, userId: string): boolean {
    const files = db.files.get(serverId) || [];
    const file = files.find(f => f.path === filePath && !f.isDirectory);
    if (!file) {
      // Create if doesn't exist
      const fileName = filePath.split('/').pop() || filePath;
      const newFile: ServerFile = {
        name: fileName,
        path: filePath,
        isDirectory: false,
        size: Buffer.byteLength(content, 'utf8'),
        lastModified: new Date().toISOString(),
        content
      };
      files.push(newFile);
      db.files.set(serverId, files);
    } else {
      file.content = content;
      file.size = Buffer.byteLength(content, 'utf8');
      file.lastModified = new Date().toISOString();
    }

    db.logAudit('SERVER', 'SAVE_FILE', userId, { serverId, filePath });
    return true;
  }

  public createFile(serverId: string, path: string, isDirectory: boolean, content: string = '', userId: string): boolean {
    const files = db.files.get(serverId) || [];
    if (files.some(f => f.path === path)) {
      return false; // Already exists
    }

    const name = path.split('/').filter(Boolean).pop() || path;
    const newFile: ServerFile = {
      name,
      path,
      isDirectory,
      size: isDirectory ? 0 : Buffer.byteLength(content, 'utf8'),
      lastModified: new Date().toISOString(),
      content: isDirectory ? undefined : content
    };

    files.push(newFile);
    db.files.set(serverId, files);
    db.logAudit('SERVER', 'CREATE_FILE', userId, { serverId, path, isDirectory });
    return true;
  }

  public deleteFile(serverId: string, path: string, userId: string): boolean {
    const files = db.files.get(serverId) || [];
    const initialLen = files.length;
    // Remove target file and any child files if directory
    const updated = files.filter(f => f.path !== path && !f.path.startsWith(path + '/'));
    db.files.set(serverId, updated);

    db.logAudit('SERVER', 'DELETE_FILE', userId, { serverId, path });
    return updated.length < initialLen;
  }
}

export const fileService = new FileService();
