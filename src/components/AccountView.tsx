// AccountView Component
// Profile settings, active session tokens, security controls, and dark purple theme

import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  Clock,
  LogOut,
  Mail,
  Coins,
  CheckCircle2,
  Lock,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccountView: React.FC = () => {
  const { user, credits, logout, switchAccount } = useAuth();
  const [savedSettings, setSavedSettings] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-3xl glass-panel border border-purple-900/30">
        <h2 className="text-2xl font-black text-white font-display">Account Profile & Security</h2>
        <p className="text-xs text-slate-300 mt-1">
          Authoritative server-side identity, active wallet balance, and session credentials.
        </p>
      </div>

      {savedSettings && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Account preferences updated successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="rounded-3xl glass-panel border border-purple-900/30 p-6 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-950/50">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user?.username}</h3>
              <p className="text-xs text-purple-300 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-purple-900/30 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-purple-900/20">
              <span className="text-slate-400">User Identifier</span>
              <span className="font-mono text-white font-semibold">{user?.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-purple-900/20">
              <span className="text-slate-400">Security Role</span>
              <span className="font-bold text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700/40">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-purple-900/20">
              <span className="text-slate-400">Credits Wallet Balance</span>
              <span className="font-mono font-bold text-white text-sm">
                {credits} <span className="text-purple-400 text-xs">INF</span>
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Account Status</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user?.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Security & Quick Actions */}
        <div className="rounded-3xl glass-panel border border-purple-900/30 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>Role Switcher & Sessions</span>
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Active session is cryptographically validated with sha256 tokens and synchronized with Firebase Authentication.
            </p>
          </div>

          <div className="space-y-3 pt-3">
            <button
              onClick={() => switchAccount(user?.role === 'ADMIN' ? 'USER' : 'ADMIN')}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/40 text-purple-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Switch to {user?.role === 'ADMIN' ? 'Standard User' : 'Administrator'}</span>
              <Shield className="w-4 h-4 text-purple-300" />
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Sign Out of Session</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
