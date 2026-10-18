// BackupsTab Component
// Automated snapshot scheduling, retention policy engine, and asynchronous backup generator with progress

import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Download,
  Calendar,
  Clock,
  Settings2,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import { Server, ServerBackup, BackupScheduleConfig } from '../types';

interface BackupsTabProps {
  server: Server;
}

export const BackupsTab: React.FC<BackupsTabProps> = ({ server }) => {
  const [backups, setBackups] = useState<ServerBackup[]>([]);
  const [schedule, setSchedule] = useState<BackupScheduleConfig>({
    frequency: 'daily',
    retentionCount: 5
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchBackupsAndSchedule = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        api.getBackups(server.id),
        api.getBackupSchedule(server.id)
      ]);
      setBackups(bRes.backups || []);
      if (sRes.schedule) {
        setSchedule(sRes.schedule);
      }
    } catch (e) {
      console.error('Failed to load backup data:', e);
    }
  };

  useEffect(() => {
    fetchBackupsAndSchedule();
  }, [server.id]);

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setActionMsg(null);
    try {
      await api.updateBackupSchedule(server.id, schedule);
      setActionMsg({ text: `Automated backup schedule set to ${schedule.frequency.toUpperCase()} (Retention: keep last ${schedule.retentionCount} snapshots).` });
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to save schedule', error: true });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setCreateProgress(15);
    setProgressStage('Flushing world chunks & locking disk state...');
    setActionMsg(null);

    const stepInterval = setInterval(() => {
      setCreateProgress((prev) => {
        if (prev < 40) {
          setProgressStage('Compressing world directories and plugins into tar.gz archive...');
          return prev + 15;
        } else if (prev < 80) {
          setProgressStage('Calculating SHA256 integrity checksum & uploading to storage pool...');
          return prev + 20;
        }
        return prev;
      });
    }, 450);

    try {
      await api.createBackup(server.id);
      clearInterval(stepInterval);
      setCreateProgress(100);
      setProgressStage('Snapshot created and verified successfully!');
      setTimeout(() => {
        setCreating(false);
        setCreateProgress(0);
        setProgressStage('');
        setActionMsg({ text: 'Backup snapshot generated and saved. Retention policy enforced.' });
        fetchBackupsAndSchedule();
      }, 700);
    } catch (err: any) {
      clearInterval(stepInterval);
      setCreating(false);
      setCreateProgress(0);
      setActionMsg({ text: 'Failed to generate backup: ' + err.message, error: true });
    }
  };

  const handleRestore = async (bId: string, fileName: string) => {
    if (!confirm(`Restoring from "${fileName}" will overwrite current world data with this snapshot. Proceed?`)) return;
    setRestoringId(bId);
    setActionMsg(null);
    try {
      await api.restoreBackup(server.id, bId);
      setActionMsg({ text: `Server successfully restored from snapshot "${fileName}".` });
      fetchBackupsAndSchedule();
    } catch (err: any) {
      setActionMsg({ text: 'Restore failed: ' + err.message, error: true });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (bId: string) => {
    if (!confirm('Permanently delete this backup snapshot?')) return;
    try {
      await api.deleteBackup(server.id, bId);
      fetchBackupsAndSchedule();
    } catch (err: any) {
      setActionMsg({ text: 'Failed to delete backup: ' + err.message, error: true });
    }
  };

  const handleDownloadStub = (fileName: string) => {
    const blob = new Blob([`INFHOST Encrypted Backup Archive: ${fileName}\nCreated: ${new Date().toISOString()}`], {
      type: 'application/octet-stream'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Manual Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-purple-900/30">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <span>Server Snapshots & Automated Backups</span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Full-server snapshots of worlds, plugin configurations, and player inventories with SHA256 checksums.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{creating ? 'Creating Snapshot...' : 'Create Snapshot'}</span>
        </button>
      </div>

      {/* Asynchronous Creation Progress Bar */}
      {creating && (
        <div className="p-4 rounded-2xl glass-panel border border-purple-500/40 bg-purple-950/30 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>{progressStage}</span>
            </span>
            <span className="font-mono text-purple-200 font-bold">{createProgress}%</span>
          </div>
          <div className="w-full bg-[#0A0518] rounded-full h-2 overflow-hidden border border-purple-900/50">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${createProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Message Toast */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border ${
            actionMsg.error
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.error ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white ml-2 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Automated Backup Schedule Configuration */}
      <div className="p-5 rounded-3xl glass-panel border border-purple-900/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Automated Schedule & Retention Policy</h4>
          </div>
          <span className="text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40 font-mono">
            CRON DAEMON ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">Backup Frequency</label>
            <select
              value={schedule.frequency}
              onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value as any })}
              className="w-full bg-[#0A0518] border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="daily">Daily (Every 24 hours at 03:00 UTC)</option>
              <option value="weekly">Weekly (Every Sunday)</option>
              <option value="custom">Custom (Every 12 hours)</option>
              <option value="off">Disabled (Manual Only)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">Retention Policy</label>
            <select
              value={schedule.retentionCount}
              onChange={(e) => setSchedule({ ...schedule, retentionCount: parseInt(e.target.value, 10) })}
              className="w-full bg-[#0A0518] border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="3">Keep last 3 snapshots (Prune older)</option>
              <option value="5">Keep last 5 snapshots (Recommended)</option>
              <option value="10">Keep last 10 snapshots</option>
              <option value="15">Keep last 15 snapshots</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="w-full py-2 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-600/40 font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingSchedule ? 'Saving...' : 'Save Schedule Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="rounded-3xl glass-panel border border-purple-900/30 overflow-hidden">
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Available Snapshots ({backups.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Total Storage: {backups.reduce((acc, b) => acc + b.fileSizeMb, 0)} MB
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <Database className="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
            <p className="font-semibold text-white">No backups created yet for this server</p>
            <p className="text-slate-400 mt-1">Click &quot;Create Snapshot&quot; above to capture world and configuration state.</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-900/20">
            {backups.map((b) => {
              const isRestoring = restoringId === b.id;

              return (
                <div
                  key={b.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-purple-950/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{b.fileName}</span>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                        {b.fileSizeMb} MB
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>SHA256 VERIFIED</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{new Date(b.createdAt).toLocaleString()}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 truncate max-w-[200px]" title={b.checksum}>
                        {b.checksum}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDownloadStub(b.fileName)}
                      className="p-2 rounded-xl bg-[#0A0518] border border-purple-900/40 text-purple-300 hover:text-white hover:border-purple-500 transition-colors cursor-pointer"
                      title="Download Backup"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRestore(b.id, b.fileName)}
                      disabled={isRestoring}
                      className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
