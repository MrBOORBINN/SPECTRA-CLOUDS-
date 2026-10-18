// CreateServerModal Component
// Real Minecraft server configuration with genuine software, version, and node location validation

import React, { useState, useEffect } from 'react';
import { X, Server, AlertCircle, ShieldAlert, Cpu, HardDrive, Globe, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Node } from '../types';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onServerCreated: () => void;
  onGoToAdmin: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onServerCreated,
  onGoToAdmin
}) => {
  const [name, setName] = useState('Survival Realm');
  const [software, setSoftware] = useState('Paper');
  const [version, setVersion] = useState('1.21.4');
  const [ramMb, setRamMb] = useState(4096);
  const [cpuCores, setCpuCores] = useState(2);
  const [storageMb, setStorageMb] = useState(20480);
  const [selectedLocation, setSelectedLocation] = useState('Germany');
  const [selectedRegion, setSelectedRegion] = useState('Europe');
  const [timezone, setTimezone] = useState('UTC');
  const [description, setDescription] = useState('Standard survival multiplayer server');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onlineNodes = nodes.filter((n) => n.status === 'ONLINE');
  const hasNodes = onlineNodes.length > 0;

  // Real IANA Timezones
  const ianaTimezones = [
    { id: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
    { id: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9:00)' },
    { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
    { id: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { id: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
    { id: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' }
  ];

  // Software Catalog with real versions
  const softwareMap: Record<string, string[]> = {
    Paper: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5'],
    Purpur: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4'],
    Vanilla: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.9'],
    Fabric: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2'],
    Forge: ['1.21.1', '1.20.1', '1.19.2', '1.18.2', '1.16.5', '1.12.2'],
    NeoForge: ['1.21.1', '1.20.4'],
    Spigot: ['1.21.1', '1.20.4', '1.19.4', '1.18.2', '1.16.5']
  };

  useEffect(() => {
    if (softwareMap[software] && !softwareMap[software].includes(version)) {
      setVersion(softwareMap[software][0]);
    }
  }, [software]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.createServer({
        name,
        software,
        version,
        ramMb,
        cpuCores,
        storageMb,
        location: selectedLocation,
        region: selectedRegion,
        timezone,
        description
      });
      onServerCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl glass-panel border border-[#1E293B] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Minecraft Server</h2>
              <p className="text-xs text-slate-400">Deploy a dedicated container instance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if no VPS node connected */}
        {!hasNodes && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-white">NO NODE CONNECTED</span>
              You may create a server definition, but it will remain in <span className="font-mono font-bold text-rose-300">NO_NODE</span> state and cannot be started until a physical VPS node connects to the cluster.
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToAdmin();
                }}
                className="mt-2 text-indigo-300 hover:text-indigo-200 underline font-semibold block cursor-pointer"
              >
                Go to Admin Panel to register or connect a node →
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Server Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Server Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Minecraft Server"
                className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Server Address Preview
              </label>
              <div className="w-full bg-[#060810] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 flex items-center">
                <span>{name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'server'}.infhost.net:PORT</span>
              </div>
            </div>
          </div>

          {/* Software & Version Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Minecraft Software
              </label>
              <select
                value={software}
                onChange={(e) => setSoftware(e.target.value)}
                className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Object.keys(softwareMap).map((soft) => (
                  <option key={soft} value={soft}>
                    {soft}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Software Version
              </label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {softwareMap[software]?.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hardware Allocation Presets */}
          <div className="p-4 rounded-2xl bg-[#090D18] border border-purple-900/30 space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Select Plan Tier Preset</span>
              </span>
              <span className="text-[11px] text-purple-400 font-mono">6 Plans Available</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: 'Dirt', credits: 390, ram: 2048, cpu: 1, disk: 10240 },
                { name: 'Stone', credits: 690, ram: 4096, cpu: 2, disk: 25600 },
                { name: 'Copper', credits: 1190, ram: 6144, cpu: 3, disk: 40960 },
                { name: 'Iron', credits: 1690, ram: 8192, cpu: 4, disk: 61440 },
                { name: 'Gold', credits: 2490, ram: 12288, cpu: 6, disk: 102400 },
                { name: 'Emerald', credits: 3990, ram: 16384, cpu: 8, disk: 153600 }
              ].map((tier) => {
                const isSelected = ramMb === tier.ram && cpuCores === tier.cpu && storageMb === tier.disk;
                return (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => {
                      setRamMb(tier.ram);
                      setCpuCores(tier.cpu);
                      setStorageMb(tier.disk);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-md shadow-purple-950/40'
                        : 'bg-[#0A0518] border-purple-950/60 text-slate-300 hover:border-purple-800'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>{tier.name}</span>
                      <span className="text-purple-300 font-mono text-[10px]">{tier.credits} INF</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {tier.ram / 1024}GB RAM · {tier.cpu} vCPU
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">RAM (MB)</label>
                <select
                  value={ramMb}
                  onChange={(e) => setRamMb(Number(e.target.value))}
                  className="w-full bg-[#0D1322] border border-purple-900/40 rounded-xl px-3 py-2 text-xs font-mono text-white"
                >
                  <option value={2048}>2 GB (2048 MB)</option>
                  <option value={4096}>4 GB (4096 MB)</option>
                  <option value={6144}>6 GB (6144 MB)</option>
                  <option value={8192}>8 GB (8192 MB)</option>
                  <option value={12288}>12 GB (12288 MB)</option>
                  <option value={16384}>16 GB (16384 MB)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">vCPU Cores</label>
                <select
                  value={cpuCores}
                  onChange={(e) => setCpuCores(Number(e.target.value))}
                  className="w-full bg-[#0D1322] border border-purple-900/40 rounded-xl px-3 py-2 text-xs font-mono text-white"
                >
                  <option value={1}>1 Core</option>
                  <option value={2}>2 Cores</option>
                  <option value={3}>3 Cores</option>
                  <option value={4}>4 Cores</option>
                  <option value={6}>6 Cores</option>
                  <option value={8}>8 Cores</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Storage (MB)</label>
                <select
                  value={storageMb}
                  onChange={(e) => setStorageMb(Number(e.target.value))}
                  className="w-full bg-[#0D1322] border border-purple-900/40 rounded-xl px-3 py-2 text-xs font-mono text-white"
                >
                  <option value={10240}>10 GB (10240 MB)</option>
                  <option value={25600}>25 GB (25600 MB)</option>
                  <option value={40960}>40 GB (40960 MB)</option>
                  <option value={61440}>60 GB (61440 MB)</option>
                  <option value={102400}>100 GB (102400 MB)</option>
                  <option value={153600}>150 GB (153600 MB)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Node Location (Europe & Asia)</span>
              </label>
              <select
                value={`${selectedRegion}:${selectedLocation}`}
                onChange={(e) => {
                  const [reg, loc] = e.target.value.split(':');
                  setSelectedRegion(reg);
                  setSelectedLocation(loc);
                }}
                className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <optgroup label="Europe">
                  <option value="Europe:Germany">Germany (Frankfurt)</option>
                  <option value="Europe:France">France (Gravelines)</option>
                  <option value="Europe:United Kingdom">United Kingdom (London)</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Asia:Singapore">Singapore (Jurong)</option>
                  <option value="Asia:India">India (Mumbai)</option>
                  <option value="Asia:Japan">Japan (Tokyo)</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Server IANA Timezone</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono text-xs"
              >
                {ianaTimezones.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Allocating Resources...' : 'Create Server Definition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
