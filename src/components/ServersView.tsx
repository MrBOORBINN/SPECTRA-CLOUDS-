// ServersView Component
// Displays user's Minecraft servers with genuine status, ports, and lifecycle controls

import React from 'react';
import {
  Server as ServerIcon,
  Play,
  Square,
  RotateCw,
  Terminal,
  FolderClosed,
  Settings,
  AlertTriangle,
  Plus,
  Globe,
  Cpu,
  Layers,
  Trash2
} from 'lucide-react';
import { Server, Node } from '../types';

interface ServersViewProps {
  servers: Server[];
  nodes: Node[];
  onOpenCreate: () => void;
  onSelectServer: (server: Server) => void;
  onStartServer: (id: string) => void;
  onStopServer: (id: string) => void;
  onRestartServer: (id: string) => void;
  onDeleteServer: (id: string) => void;
}

export const ServersView: React.FC<ServersViewProps> = ({
  servers,
  nodes,
  onOpenCreate,
  onSelectServer,
  onStartServer,
  onStopServer,
  onRestartServer,
  onDeleteServer
}) => {
  const getStatusBadge = (status: Server['status']) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        );
      case 'STARTING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
            STARTING
          </span>
        );
      case 'STOPPING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
            STOPPING
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            OFFLINE
          </span>
        );
      case 'NO_NODE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            NO NODE CONNECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display">Minecraft Servers</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your dedicated game servers, view live telemetry, and control process runtime.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Server</span>
        </button>
      </div>

      {/* Servers List Grid */}
      {servers.length === 0 ? (
        <div className="rounded-3xl glass-panel border border-[#1E293B] p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <ServerIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Servers Deployed Yet</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Create your first Minecraft server definition. Select your preferred software like Paper, Purpur, or Fabric with custom RAM and core limits.
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Server Definition</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((server) => {
            const hasNode = server.status !== 'NO_NODE';
            const serverPort = server.allocation?.port;

            return (
              <div
                key={server.id}
                className="rounded-2xl glass-panel border border-[#1E293B] p-5 space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer" onClick={() => onSelectServer(server)}>
                          {server.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                          {server.software} {server.version}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{server.description}</p>
                    </div>
                    {getStatusBadge(server.status)}
                  </div>

                  {/* Server Address & Port Box */}
                  <div className="mt-4 p-3 rounded-xl bg-[#080C16] border border-[#1E293B] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <div className="text-xs">
                        <span className="text-slate-400 text-[10px] block">SERVER ADDRESS</span>
                        <span className={`font-mono font-semibold ${hasNode && serverPort ? 'text-purple-300' : 'text-rose-400'}`}>
                          {hasNode && serverPort
                            ? `${server.identifier}.infhost.net:${serverPort}`
                            : 'NO NODE CONNECTED'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {server.dnsConfigured ? 'DNS SYNCED' : 'DNS NOT CONFIGURED'}
                    </span>
                  </div>

                  {/* Specs Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                      <span className="text-[10px] text-slate-400 block">RAM</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">{server.ramMb / 1024} GB</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                      <span className="text-[10px] text-slate-400 block">CPU</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">{server.cpuCores} vCPU</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                      <span className="text-[10px] text-slate-400 block">DISK</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">{server.storageMb / 1024} GB</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {server.status === 'ONLINE' ? (
                      <>
                        <button
                          onClick={() => onStopServer(server.id)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Stop Server"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop</span>
                        </button>
                        <button
                          onClick={() => onRestartServer(server.id)}
                          className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Restart Server"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onStartServer(server.id)}
                        disabled={server.status === 'NO_NODE'}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title={server.status === 'NO_NODE' ? 'Node must be connected to start' : 'Start Server'}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectServer(server)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Console & Manage</span>
                    </button>
                    <button
                      onClick={() => onDeleteServer(server.id)}
                      className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Server"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
