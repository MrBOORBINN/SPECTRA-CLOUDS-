// ConsoleTab Component
// Real-time Minecraft console terminal with command dispatch and strict OS command prevention

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Trash2, ArrowDown, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Server } from '../types';

interface ConsoleTabProps {
  server: Server;
  onRefreshServer: () => void;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = ({ server, onRefreshServer }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.getConsoleLogs(server.id);
      setLogs(res.logs || []);
    } catch {
      // offline
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [server.id]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setErrorMsg(null);
    setLoading(true);
    const cmdToSend = command.trim();
    setCommand('');

    try {
      const res = await api.sendCommand(server.id, cmdToSend);
      if (res.output) {
        setLogs((prev) => [...prev, `[Server thread/INFO]: ${res.output}`]);
      }
      fetchLogs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch command');
    } finally {
      setLoading(false);
    }
  };

  const getLineColor = (line: string) => {
    if (line.includes('/WARN') || line.includes('WARNING')) return 'text-amber-400';
    if (line.includes('/ERROR') || line.includes('Exception') || line.includes('Failed')) return 'text-rose-400';
    if (line.includes('[Console] >')) return 'text-cyan-300 font-bold';
    if (line.includes('[INFHOST Daemon]')) return 'text-indigo-300';
    if (line.includes('Done (')) return 'text-emerald-400 font-bold';
    return 'text-slate-300';
  };

  return (
    <div className="space-y-4">
      {/* Console Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white font-mono">
            {server.name} — Interactive Terminal
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              server.status === 'ONLINE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {server.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 ${
              autoScroll ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            <span>Auto-scroll</span>
          </button>
          <button
            onClick={() => setLogs([])}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={scrollRef}
        className="w-full h-[450px] bg-[#05070D] border border-[#1E293B] rounded-2xl p-4 font-mono-code text-xs overflow-y-auto space-y-1 select-text shadow-inner"
      >
        {server.status === 'NO_NODE' ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <ShieldAlert className="w-10 h-10 text-rose-500 mb-2" />
            <span className="text-sm font-bold text-rose-400 font-mono">NO NODE CONNECTED</span>
            <p className="text-xs max-w-md mt-1 text-slate-400">
              Live console streaming is disabled because this server definition is not bound to an active VPS node.
            </p>
          </div>
        ) : server.status === 'OFFLINE' ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Terminal className="w-10 h-10 text-slate-600 mb-2" />
            <span className="text-sm font-bold text-slate-400 font-mono">SERVER PROCESS OFFLINE</span>
            <p className="text-xs max-w-md mt-1 text-slate-400">
              Start the Minecraft server to initiate container runtime and open the live command socket.
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-slate-500 italic p-2">Connecting to container log buffer...</div>
        ) : (
          logs.map((line, idx) => (
            <div key={idx} className={`leading-relaxed break-all ${getLineColor(line)}`}>
              {line}
            </div>
          ))
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Command Input Box */}
      <form onSubmit={handleSendCommand} className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold text-sm">
          /
        </div>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={server.status !== 'ONLINE' || loading}
          placeholder={
            server.status === 'ONLINE'
              ? 'Enter Minecraft command (e.g. op, say, gamemode, whitelist, time set day)...'
              : 'Server must be online to execute commands'
          }
          className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl pl-8 pr-24 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={server.status !== 'ONLINE' || loading || !command.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3" />
          <span>Send</span>
        </button>
      </form>

      {/* Quick Minecraft Command Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] text-slate-400">Quick Commands:</span>
        {['say Hello from INFHOST!', 'list', 'tps', 'time set day', 'weather clear', 'difficulty normal'].map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={server.status !== 'ONLINE'}
            onClick={() => setCommand(preset)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors disabled:opacity-40"
          >
            /{preset}
          </button>
        ))}
      </div>
    </div>
  );
};
