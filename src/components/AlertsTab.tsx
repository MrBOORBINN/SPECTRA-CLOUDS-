// AlertsTab Component
// Resource monitoring alert system with customizable CPU, RAM, and storage thresholds,
// automated polling comparison, and in-app/email dispatch

import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Cpu,
  HardDrive,
  Mail,
  CheckCircle2,
  ShieldAlert,
  Settings,
  History,
  Activity,
  Sliders,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { Server, ResourceAlertSettings, ResourceAlertEvent } from '../types';

interface AlertsTabProps {
  server: Server;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ server }) => {
  const [settings, setSettings] = useState<ResourceAlertSettings>({
    enabled: true,
    cpuThresholdPct: 90,
    ramThresholdPct: 85,
    diskThresholdPct: 85,
    emailNotify: true
  });
  const [events, setEvents] = useState<ResourceAlertEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchAlertsData = async () => {
    try {
      const res = await api.getAlerts(server.id);
      if (res.settings) setSettings(res.settings);
      if (res.events) setEvents(res.events);
    } catch (e) {
      console.error('Failed to load alert settings:', e);
    }
  };

  useEffect(() => {
    fetchAlertsData();
    const interval = setInterval(fetchAlertsData, 6000);
    return () => clearInterval(interval);
  }, [server.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.updateAlerts(server.id, settings);
      setSaveMsg('Alert thresholds updated. Live daemon will notify upon threshold breach.');
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save alert settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentRamPct = Math.round((server.ramUsedMb / Math.max(server.ramMb, 1)) * 100);
  const currentDiskPct = Math.round((server.diskUsedMb / Math.max(server.storageMb, 1)) * 100);

  const cpuExceeded = server.status === 'ONLINE' && server.cpuUsagePct >= settings.cpuThresholdPct;
  const ramExceeded = server.status === 'ONLINE' && currentRamPct >= settings.ramThresholdPct;
  const diskExceeded = server.status === 'ONLINE' && currentDiskPct >= settings.diskThresholdPct;
  const anyBreach = cpuExceeded || ramExceeded || diskExceeded;

  return (
    <div className="space-y-6">
      {/* Active Breach Warning Banner */}
      {anyBreach && settings.enabled && (
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3.5 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm text-white block">Resource Usage Threshold Exceeded!</span>
            <p className="mt-0.5 text-rose-200">
              {cpuExceeded && `CPU usage (${server.cpuUsagePct}%) is above ${settings.cpuThresholdPct}%. `}
              {ramExceeded && `RAM usage (${currentRamPct}%) is above ${settings.ramThresholdPct}%. `}
              {diskExceeded && `Storage usage (${currentDiskPct}%) is above ${settings.diskThresholdPct}%. `}
              Alert notifications dispatched to registered administrator email (infbuisness01@gmail.com).
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-purple-900/30">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <span>Resource Monitoring & Alert Policies</span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Configure automated telemetry polling. Get notified when CPU, RAM, or storage exceeds limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              settings.enabled
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{settings.enabled ? 'ALERTS ACTIVE' : 'ALERTS DISABLED'}</span>
          </span>
        </div>
      </div>

      {saveMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Live Telemetry vs Threshold Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Gauge */}
        <div className={`p-4 rounded-3xl glass-panel border transition-all ${
          cpuExceeded ? 'border-rose-500/50 bg-rose-950/20' : 'border-purple-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>CPU Threshold</span>
            </span>
            <span className="text-xs font-mono font-bold text-purple-300">
              Limit: {settings.cpuThresholdPct}%
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Current Load</span>
              <span className={`font-mono font-bold ${cpuExceeded ? 'text-rose-400' : 'text-white'}`}>
                {server.status === 'ONLINE' ? `${server.cpuUsagePct}%` : 'Offline'}
              </span>
            </div>
            <div className="w-full bg-[#0A0518] rounded-full h-2 overflow-hidden border border-purple-900/40">
              <div
                className={`h-full transition-all duration-300 ${
                  cpuExceeded ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, server.status === 'ONLINE' ? server.cpuUsagePct : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* RAM Gauge */}
        <div className={`p-4 rounded-3xl glass-panel border transition-all ${
          ramExceeded ? 'border-rose-500/50 bg-rose-950/20' : 'border-purple-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>RAM Threshold</span>
            </span>
            <span className="text-xs font-mono font-bold text-purple-300">
              Limit: {settings.ramThresholdPct}%
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Current Usage</span>
              <span className={`font-mono font-bold ${ramExceeded ? 'text-rose-400' : 'text-white'}`}>
                {server.status === 'ONLINE' ? `${currentRamPct}% (${Math.round(server.ramUsedMb)}MB)` : 'Offline'}
              </span>
            </div>
            <div className="w-full bg-[#0A0518] rounded-full h-2 overflow-hidden border border-purple-900/40">
              <div
                className={`h-full transition-all duration-300 ${
                  ramExceeded ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, server.status === 'ONLINE' ? currentRamPct : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Storage Gauge */}
        <div className={`p-4 rounded-3xl glass-panel border transition-all ${
          diskExceeded ? 'border-rose-500/50 bg-rose-950/20' : 'border-purple-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Storage Threshold</span>
            </span>
            <span className="text-xs font-mono font-bold text-purple-300">
              Limit: {settings.diskThresholdPct}%
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Disk Footprint</span>
              <span className={`font-mono font-bold ${diskExceeded ? 'text-rose-400' : 'text-white'}`}>
                {currentDiskPct}% ({Math.round(server.diskUsedMb / 1024)}GB)
              </span>
            </div>
            <div className="w-full bg-[#0A0518] rounded-full h-2 overflow-hidden border border-purple-900/40">
              <div
                className={`h-full transition-all duration-300 ${
                  diskExceeded ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, currentDiskPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl glass-panel border border-purple-900/30 space-y-6">
        <div className="flex items-center justify-between border-b border-purple-900/30 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Adjust Monitoring Thresholds</h4>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="rounded accent-purple-600 w-4 h-4"
            />
            <span className="font-semibold">Enable Threshold Monitoring</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* CPU Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-slate-300 font-medium">CPU Trigger Threshold</label>
              <span className="font-mono text-purple-300 font-bold">{settings.cpuThresholdPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              step="1"
              value={settings.cpuThresholdPct}
              onChange={(e) => setSettings({ ...settings, cpuThresholdPct: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 bg-[#0A0518] rounded-lg h-2 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Trigger alert if server CPU sustains usage above this level.</p>
          </div>

          {/* RAM Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-slate-300 font-medium">RAM Trigger Threshold</label>
              <span className="font-mono text-purple-300 font-bold">{settings.ramThresholdPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              step="1"
              value={settings.ramThresholdPct}
              onChange={(e) => setSettings({ ...settings, ramThresholdPct: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 bg-[#0A0518] rounded-lg h-2 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Alerts before out-of-memory errors occur.</p>
          </div>

          {/* Disk Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-slate-300 font-medium">Storage Trigger Threshold</label>
              <span className="font-mono text-purple-300 font-bold">{settings.diskThresholdPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              step="1"
              value={settings.diskThresholdPct}
              onChange={(e) => setSettings({ ...settings, diskThresholdPct: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 bg-[#0A0518] rounded-lg h-2 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Ensures chunk logs or backups do not exhaust node disk.</p>
          </div>
        </div>

        {/* Email Notification Channel */}
        <div className="p-4 rounded-2xl bg-[#0A0518] border border-purple-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold block">Email Dispatch Channel</span>
              <span className="text-slate-400">Sends instant notification to <strong className="text-purple-300">infbuisness01@gmail.com</strong></span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotify}
              onChange={(e) => setSettings({ ...settings, emailNotify: e.target.checked })}
              className="rounded accent-purple-600 w-4 h-4"
            />
            <span className="text-slate-300 font-medium">Email Alerts Active</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Monitoring Configuration'}
          </button>
        </div>
      </form>

      {/* Alert History / Incident Log */}
      <div className="rounded-3xl glass-panel border border-purple-900/30 overflow-hidden">
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Triggered Alert Incident Log</h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Logged Incidents: {events.length}</span>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-white">All systems nominal</p>
            <p className="text-slate-400 mt-0.5">No resource alert incidents have been recorded for this server.</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-900/20">
            {events.map((ev) => (
              <div key={ev.id} className="p-4 flex items-start gap-3 hover:bg-purple-950/20 transition-colors text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{ev.metric} Threshold Exceeded</span>
                    <span className="text-slate-400 font-mono text-[11px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5">{ev.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
