// ServerDetailView Component
// Master control deck for an individual Minecraft server instance

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  Skull,
  Terminal,
  FolderClosed,
  Database,
  Package,
  Settings,
  Globe,
  Cpu,
  HardDrive,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Bell
} from 'lucide-react';
import { api } from '../lib/api';
import { Server, Node } from '../types';
import { ConsoleTab } from './ConsoleTab';
import { FileManagerTab } from './FileManagerTab';
import { BackupsTab } from './BackupsTab';
import { PluginsTab } from './PluginsTab';
import { AlertsTab } from './AlertsTab';

interface ServerDetailViewProps {
  serverId: string;
  onBack: () => void;
  nodes: Node[];
}

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({ serverId, onBack, nodes }) => {
  const [server, setServer] = useState<Server | null>(null);
  const [dnsStatus, setDnsStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'backups' | 'plugins' | 'alerts' | 'settings'>('console');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchServer = async () => {
    try {
      const res = await api.getServer(serverId);
      setServer(res.server);
      setDnsStatus(res.dnsStatus);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServer();
    const interval = setInterval(fetchServer, 5000);
    return () => clearInterval(interval);
  }, [serverId]);

  const handleStart = async () => {
    setActionError(null);
    try {
      await api.startServer(serverId);
      fetchServer();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleStop = async () => {
    setActionError(null);
    try {
      await api.stopServer(serverId);
      fetchServer();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleRestart = async () => {
    setActionError(null);
    try {
      await api.restartServer(serverId);
      fetchServer();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleKill = async () => {
    setActionError(null);
    try {
      await api.killServer(serverId);
      fetchServer();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  if (loading || !server) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading server telemetry...
      </div>
    );
  }

  const isOnline = server.status === 'ONLINE';
  const hasNode = server.status !== 'NO_NODE' && !!server.nodeId;
  const assignedNode = nodes.find((n) => n.id === server.nodeId);
  const nodeHasRealIp =
    assignedNode &&
    assignedNode.publicIp &&
    assignedNode.publicIp.trim() !== '' &&
    assignedNode.publicIp !== 'NO NODE CONNECTED';
  const serverPort = server.allocation?.port;

  // Strict rule: If no real node/VPS is connected, show: "NO NODE CONNECTED"
  // Only display a Public IP after a real VPS Node Agent connects and reports its actual public IP.
  const displayAddress =
    hasNode && nodeHasRealIp && serverPort
      ? `${assignedNode.publicIp}:${serverPort}`
      : 'NO NODE CONNECTED';

  const copyAddress = () => {
    if (displayAddress === 'NO NODE CONNECTED') return;
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white font-display">{server.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  server.status === 'ONLINE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : server.status === 'NO_NODE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {server.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {server.software} {server.version} · Timezone: {server.timezone}
            </p>
          </div>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="flex items-center gap-2">
          {server.status === 'ONLINE' ? (
            <>
              <button
                onClick={handleStop}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-950/40"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
              <button
                onClick={handleRestart}
                className="p-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleKill}
                className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 border border-rose-800/40 text-xs font-bold transition-colors cursor-pointer"
                title="Kill Process (SIGKILL)"
              >
                <Skull className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              disabled={server.status === 'NO_NODE'}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Server</span>
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Execution Blocked</span>
            <span>{actionError}</span>
          </div>
        </div>
      )}

      {/* Server Address & Resource Telemetry Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Connection Address Card */}
        <div className="md:col-span-2 p-4 rounded-2xl glass-panel border border-[#1E293B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Server Address
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {dnsStatus?.configured ? 'DNS SYNCED' : 'DNS NOT CONFIGURED'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-[#080C14] border border-[#1E293B]">
            <span
              className={`font-mono text-sm font-bold truncate ${
                displayAddress === 'NO NODE CONNECTED' ? 'text-rose-400' : 'text-purple-300'
              }`}
            >
              {displayAddress}
            </span>
            {displayAddress !== 'NO NODE CONNECTED' && (
              <button
                onClick={copyAddress}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Copy Address"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Players Card */}
        <div className="p-4 rounded-2xl glass-panel border border-[#1E293B] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Online Players
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {isOnline ? `${server.playerCount} / ${server.maxPlayers}` : 'NODE OFFLINE'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Verified process socket</span>
          </div>
        </div>

        {/* RAM Usage Card */}
        <div className="p-4 rounded-2xl glass-panel border border-[#1E293B] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            Memory (RAM)
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {isOnline ? `${(server.ramUsedMb / 1024).toFixed(1)} / ${(server.ramMb / 1024).toFixed(0)} GB` : 'NODE OFFLINE'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Limit: {server.ramMb} MB
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-[#090D18] rounded-2xl border border-[#1E293B] overflow-x-auto">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'console' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'files' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderClosed className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'backups' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backups</span>
        </button>

        <button
          onClick={() => setActiveTab('plugins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'plugins' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Plugins & Mods</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'alerts' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Resource Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'settings' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Viewport */}
      <div>
        {activeTab === 'console' && <ConsoleTab server={server} onRefreshServer={fetchServer} />}
        {activeTab === 'files' && <FileManagerTab server={server} />}
        {activeTab === 'backups' && <BackupsTab server={server} />}
        {activeTab === 'plugins' && <PluginsTab server={server} onRefreshServer={fetchServer} />}
        {activeTab === 'alerts' && <AlertsTab server={server} />}
        {activeTab === 'settings' && (
          <div className="rounded-2xl glass-panel border border-[#1E293B] p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Server Metadata & Environment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#090D18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Server ID</span>
                <span className="font-mono text-white mt-1 block">{server.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090D18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Assigned Port</span>
                <span className="font-mono text-cyan-300 mt-1 block">{serverPort || 'None (Unassigned)'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090D18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Subdomain Host</span>
                <span className="font-mono text-white mt-1 block">{server.subdomain}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090D18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Timezone</span>
                <span className="font-mono text-white mt-1 block">{server.timezone}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
