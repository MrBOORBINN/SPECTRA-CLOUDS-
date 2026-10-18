// Sidebar Component for INFHOST

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Terminal,
  FolderClosed,
  Database,
  Coins,
  Package,
  Settings,
  Headphones,
  Shield,
  Zap,
  Box,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'servers', label: 'Servers', icon: Box },
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'files', label: 'Files', icon: FolderClosed },
    { id: 'backups', label: 'Backups', icon: Database },
    { id: 'credits', label: 'Credits & Billing', icon: Coins },
    { id: 'marketplace', label: 'Marketplace', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: Headphones }
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080C14] border-r border-[#1E293B]/70 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1E293B]/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <div className="w-full h-full bg-[#080C14] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black tracking-wider text-white font-display">
              INFHOST
            </div>
            <div className="text-[10px] tracking-widest uppercase text-slate-400 font-semibold">
              HOST BEYOND LIMITS
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#3B2F7E] text-white shadow-lg shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D1322]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Admin Panel Nav Item */}
          <div className="pt-3 mt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-amber-600/20 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-950/30'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-[#0D1322]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin Panel</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                {user?.role === 'ADMIN' ? 'ACTIVE' : 'ACCESS'}
              </span>
            </button>
          </div>
        </nav>

        {/* Bottom Support Widget Card matching screenshot */}
        <div className="p-4 m-3 rounded-2xl glass-panel border border-[#1E293B] relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Need Help?</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Our support team is here for you 24/7.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleNavClick('support')}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
          >
            <span>Join Discord</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </aside>
    </>
  );
};
