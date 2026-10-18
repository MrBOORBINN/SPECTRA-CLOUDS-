// Header Component for INFHOST

import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown, User as UserIcon, Shield, LogOut, Zap, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onNavigate?: (tab: string) => void;
  activeNodesCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onNavigate, activeNodesCount }) => {
  const { user, credits, logout, switchAccount } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-[#070A12]/90 backdrop-blur-md border-b border-[#1E293B]/60">
      {/* Left zone: Mobile toggle & Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input matching screenshot */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D1322] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right zone: Notifications, Node indicator, and User Account */}
      <div className="flex items-center gap-3">
        {/* Node Connectivity Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono glass-panel border border-[#1E293B]">
          <span className={`w-2 h-2 rounded-full ${activeNodesCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300">
            {activeNodesCount > 0 ? `${activeNodesCount} Node Online` : 'No Node Connected'}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Theme/Status Button */}
        <button
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors hidden sm:flex"
          title="Theme Toggle"
        >
          <Sun className="w-4 h-4" />
        </button>

        {/* User Account Profile Capsule */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full glass-panel hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-900/30">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user?.username || 'User'}
                </span>
                {user?.role === 'ADMIN' && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block leading-tight truncate max-w-[120px]">
                {user?.email || 'infbuisness01@gmail.com'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Menu Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-800">
                <div className="text-sm font-semibold text-white">{user?.username}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
                <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> INF Credits:
                  </span>
                  <span className="font-mono font-bold text-indigo-300 tabular-nums">
                    {credits} INF
                  </span>
                </div>
              </div>

              <div className="py-1 text-xs">
                {/* Switch Role / Account Helpers */}
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Switch Account
                </div>
                <button
                  onClick={() => {
                    switchAccount('USER');
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    user?.role === 'USER' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Standard User (infbuisness01@gmail.com)</span>
                </button>
                <button
                  onClick={() => {
                    switchAccount('ADMIN');
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    user?.role === 'ADMIN' ? 'bg-amber-600/20 text-amber-300' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Administrator (admin@infhost.net)</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                {user?.role === 'ADMIN' && onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Admin Panel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
