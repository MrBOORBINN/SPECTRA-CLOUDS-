// DashboardView Component matching screenshots exactly

import React from 'react';
import {
  Layers,
  Cpu,
  HardDrive,
  Database,
  ArrowRight,
  Crown,
  Plus,
  FolderClosed,
  RotateCcw,
  Settings,
  ChevronRight,
  Zap,
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Node, Server } from '../types';
import { NoNodeBanner } from './NoNodeBanner';

// Assets generated specifically for this interface
import heroCubesImg from '../assets/images/infhost_hero_cubes_1790339003870.jpg';
import nodeRackImg from '../assets/images/infhost_node_rack_1790339014215.jpg';

interface DashboardViewProps {
  nodes: Node[];
  servers: Server[];
  onNavigate: (tab: string) => void;
  onOpenCreateModal: () => void;
  onQuickConnectNode: () => void;
  connectingNode: boolean;
  onOpenRedeemModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  nodes,
  servers,
  onNavigate,
  onOpenCreateModal,
  onQuickConnectNode,
  connectingNode,
  onOpenRedeemModal
}) => {
  const { user, credits } = useAuth();
  const onlineNodes = nodes.filter((n) => n.status === 'ONLINE');
  const hasNodes = onlineNodes.length > 0;

  // Real capacity calculation or 0 when no node is connected
  const totalRamGb = hasNodes
    ? Math.round(onlineNodes.reduce((acc, n) => acc + n.ramCapacity, 0) / 1024)
    : 0;
  const totalCores = hasNodes
    ? onlineNodes.reduce((acc, n) => acc + n.cpuCapacity, 0)
    : 0;
  const totalStorageGb = hasNodes
    ? Math.round(onlineNodes.reduce((acc, n) => acc + n.diskCapacity, 0) / 1024)
    : 0;

  return (
    <div className="space-y-6">
      {/* 2-Column Desktop Grid matching screenshot file_000000003594821188139a8e6761f48e.png */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Content Area (8 Cols on XL) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Welcome Back Hero Banner matching screenshots */}
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#1E293B] bg-gradient-to-r from-[#0C1122] via-[#0E152E] to-[#121B3B] p-6 sm:p-8 flex flex-col justify-between min-h-[220px]">
            {/* Background 3D Render Art on Right */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block pointer-events-none opacity-80 mix-blend-screen overflow-hidden">
              <img
                src={heroCubesImg}
                alt="INFHOST Cyber Infrastructure"
                className="w-full h-full object-cover object-center filter saturate-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C1122] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 max-w-md">
              <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold block mb-1">
                WELCOME BACK,
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
                Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">{user?.username || 'User'}</span>!
              </h1>
              <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
                Manage your hosting and explore your possibilities with INFHOST. Everything you need, in one place.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenCreateModal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-indigo-900/40 flex items-center gap-2 transition-all cursor-pointer group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Ready to create something amazing?</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards Strip matching screenshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* 1. Active Nodes */}
            <div className="p-4 rounded-2xl glass-panel border border-[#1E293B]/80 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Active Nodes</span>
                <span className="text-2xl font-black text-white font-mono tabular-nums tracking-tight mt-0.5 block">
                  {onlineNodes.length}
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasNodes ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={hasNodes ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    {hasNodes ? 'Connected' : 'No Node Connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Total Memory */}
            <div className="p-4 rounded-2xl glass-panel border border-[#1E293B]/80 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Memory</span>
                <span className="text-2xl font-black text-white font-mono tabular-nums tracking-tight mt-0.5 block">
                  {totalRamGb} GB
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Available</span>
                </div>
              </div>
            </div>

            {/* 3. CPU Cores */}
            <div className="p-4 rounded-2xl glass-panel border border-[#1E293B]/80 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">CPU Cores</span>
                <span className="text-2xl font-black text-white font-mono tabular-nums tracking-tight mt-0.5 block">
                  {totalCores}
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Available</span>
                </div>
              </div>
            </div>

            {/* 4. Storage */}
            <div className="p-4 rounded-2xl glass-panel border border-[#1E293B]/80 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Storage</span>
                <span className="text-2xl font-black text-white font-mono tabular-nums tracking-tight mt-0.5 block">
                  {totalStorageGb} GB
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node Status Card matching screenshot */}
          {!hasNodes ? (
            <NoNodeBanner
              onGoToAdmin={() => onNavigate('admin')}
              onQuickConnectTestNode={onQuickConnectNode}
              connecting={connectingNode}
            />
          ) : (
            <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="relative z-10 max-w-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Node Status
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    Online
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Your node is running smoothly!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  All systems are operational and ready to handle your requests. Connected to Europe Frankfurt Cluster.
                </p>

                <button
                  onClick={() => onNavigate('admin')}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3D Isometric Server Rack Render Image */}
              <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
                <img
                  src={nodeRackImg}
                  alt="Server Rack"
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Unlock More Power Banner matching screenshot */}
          <div className="rounded-2xl bg-gradient-to-r from-[#171333] via-[#1E1947] to-[#271E66] border border-indigo-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/30">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Unlock More Power</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Upgrade your plan and get access to more resources, features and premium support.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('credits')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold tracking-wide flex items-center gap-2 transition-all shadow-md shadow-indigo-950/50 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>Upgrade Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column / Account Overview (4 Cols on XL) */}
        <div className="xl:col-span-4 space-y-6">
          {/* User Account Overview Card matching screenshot */}
          <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 space-y-6">
            {/* Top User Profile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-900/30">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-base font-bold text-white">{user?.username || 'User'}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[150px]">{user?.email || 'infbuisness01@gmail.com'}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                    Free Plan
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            {/* Account Overview Stats */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Account Overview
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#090D18] border border-[#1E293B]/70 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">Plan</span>
                  <span className="text-xs font-bold text-white mt-1 block">Free</span>
                </div>
                <div className="border-x border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Joined</span>
                  <span className="text-xs font-bold text-white mt-1 block">Sep 24, 2025</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Status</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Credits Balance Snapshot */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Credit Wallet</span>
                <span className="text-lg font-black text-indigo-300 font-mono tabular-nums">
                  {credits} INF Credits
                </span>
              </div>
              <button
                onClick={onOpenRedeemModal}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg border border-indigo-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Redeem</span>
              </button>
            </div>

            {/* Quick Actions List matching screenshot */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Actions</span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={onOpenCreateModal}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#090D18] hover:bg-[#10172A] border border-[#1E293B]/70 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Create New</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => onNavigate('files')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#090D18] hover:bg-[#10172A] border border-[#1E293B]/70 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <FolderClosed className="w-4 h-4" />
                    </div>
                    <span>View Files</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => onNavigate('backups')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#090D18] hover:bg-[#10172A] border border-[#1E293B]/70 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <span>Manage Backups</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => onNavigate('settings')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#090D18] hover:bg-[#10172A] border border-[#1E293B]/70 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Bottom Slogan Widget matching screenshot */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 mb-0.5">
                <Zap className="w-3.5 h-3.5 fill-indigo-400" />
                <span>INFHOST Engine</span>
              </div>
              <div className="text-sm font-bold text-white">
                Better Hosting. <span className="text-indigo-400">Bigger Dreams.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
