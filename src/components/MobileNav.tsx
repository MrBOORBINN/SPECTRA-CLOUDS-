// Mobile Bottom Navigation Bar matching IMG_20260925_170914.png

import React from 'react';
import { Home, Terminal, FolderClosed, Settings } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'files', label: 'Files', icon: FolderClosed },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070A12]/95 backdrop-blur-lg border-t border-[#1E293B]/80 px-4 py-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
