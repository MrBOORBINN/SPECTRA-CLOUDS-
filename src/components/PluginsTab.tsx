// PluginsTab Component
// Full plugin and mod installation feature with real compatibility verification,
// backend API dispatch, file scaffolding, and uninstallation/update lifecycle

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import { api } from '../lib/api';
import { Server, PluginItem, ModItem, InstalledPackage } from '../types';

interface PluginsTabProps {
  server: Server;
  onRefreshServer?: () => void;
}

export const PluginsTab: React.FC<PluginsTabProps> = ({ server, onRefreshServer }) => {
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [mods, setMods] = useState<ModItem[]>([]);
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'plugins' | 'mods'>('plugins');
  const [filterView, setFilterView] = useState<'all' | 'installed' | 'compatible'>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; error?: boolean } | null>(null);

  const loadData = async () => {
    try {
      const [pRes, mRes, pkgsRes] = await Promise.all([
        api.getPlugins(),
        api.getMods(),
        api.getServerPackages(server.id)
      ]);
      setPlugins(pRes.plugins || []);
      setMods(mRes.mods || []);
      setInstalledPackages(pkgsRes.packages || []);
    } catch (e) {
      console.error('Failed to load plugin catalog:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [server.id]);

  const checkCompatibility = (supportedLoaders: string[], testedVersions: string[]) => {
    const loaderMatches = supportedLoaders.some(
      (l) => l.toLowerCase() === server.software.toLowerCase()
    );
    const versionMatches = testedVersions.some(
      (v) => server.version.startsWith(v) || v.startsWith(server.version.substring(0, 4))
    );

    if (!loaderMatches) {
      return {
        compatible: false,
        reason: `Requires ${supportedLoaders.join('/')} (Server runs: ${server.software})`
      };
    }

    if (!versionMatches) {
      return {
        compatible: false,
        reason: `Tested on ${testedVersions.slice(0, 2).join(', ')} (Server: ${server.version})`
      };
    }

    return { compatible: true, reason: 'Verified Compatible' };
  };

  const handleInstall = async (item: PluginItem | ModItem) => {
    setBusyId(item.id);
    setNotification(null);
    try {
      await api.installPackage(server.id, item.id, activeTab === 'plugins' ? 'plugin' : 'mod');
      setNotification({ text: `Successfully installed ${item.name} (${item.slug}.jar) into server runtime.` });
      await loadData();
      if (onRefreshServer) onRefreshServer();
    } catch (err: any) {
      setNotification({ text: err.message || 'Installation failed', error: true });
    } finally {
      setBusyId(null);
    }
  };

  const handleUninstall = async (packageId: string, name: string) => {
    if (!confirm(`Are you sure you want to uninstall "${name}"? This will remove its jar file.`)) return;
    setBusyId(packageId);
    setNotification(null);
    try {
      await api.uninstallPackage(server.id, packageId);
      setNotification({ text: `Uninstalled ${name} and purged jar file from server filesystem.` });
      await loadData();
      if (onRefreshServer) onRefreshServer();
    } catch (err: any) {
      setNotification({ text: err.message || 'Uninstall failed', error: true });
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdate = async (packageId: string, name: string) => {
    setBusyId(packageId);
    setNotification(null);
    try {
      await api.updatePackage(server.id, packageId);
      setNotification({ text: `Updated ${name} to latest build.` });
      await loadData();
    } catch (err: any) {
      setNotification({ text: err.message || 'Update failed', error: true });
    } finally {
      setBusyId(null);
    }
  };

  // Determine current items list
  const currentCatalog = activeTab === 'plugins' ? plugins : mods;
  const installedIds = new Set(installedPackages.map((p) => p.packageId));

  const filteredItems = currentCatalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const isInstalled = installedIds.has(item.id);
    const compat = checkCompatibility(item.supportedLoaders, item.testedVersions);

    if (filterView === 'installed') return isInstalled;
    if (filterView === 'compatible') return compat.compatible;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border ${
            notification.error
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.error ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-purple-900/30">
        <div className="flex flex-wrap items-center gap-2">
          {/* Plugins vs Mods switch */}
          <div className="flex items-center gap-1 p-1 bg-[#0A0518] rounded-xl border border-purple-900/40 text-xs font-bold">
            <button
              onClick={() => setActiveTab('plugins')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'plugins'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plugins ({plugins.length})
            </button>
            <button
              onClick={() => setActiveTab('mods')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'mods'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mods ({mods.length})
            </button>
          </div>

          {/* Subfilter */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterView('all')}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                filterView === 'all'
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-200'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterView('installed')}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                filterView === 'installed'
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-200'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Installed ({installedPackages.filter((p) => p.type === (activeTab === 'plugins' ? 'plugin' : 'mod')).length})
            </button>
            <button
              onClick={() => setFilterView('compatible')}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                filterView === 'compatible'
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-200'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Compatible
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0518] border border-purple-900/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Grid of Addons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-3xl glass-panel border border-purple-900/30 text-slate-400">
            <Package className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-white">No {activeTab} match your filter</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try changing your search term or clearing the filters above.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const compat = checkCompatibility(item.supportedLoaders, item.testedVersions);
            const isInstalled = installedIds.has(item.id);
            const installedData = installedPackages.find((p) => p.packageId === item.id);
            const isBusy = busyId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl glass-panel border border-purple-900/30 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="text-[10px] text-slate-400 font-sans">by {item.author}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-purple-400 font-mono font-medium bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                          {item.category}
                        </span>
                        {isInstalled && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>INSTALLED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compatibility Badge */}
                    <span
                      title={compat.reason}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                        compat.compatible
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {compat.compatible ? (
                        <CheckCircle className="w-3 h-3 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 shrink-0" />
                      )}
                      <span>{compat.compatible ? 'Compatible' : 'Incompatible'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2">{item.description}</p>

                  {!compat.compatible && (
                    <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>{compat.reason}</span>
                    </div>
                  )}

                  {isInstalled && installedData && (
                    <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-between font-mono bg-[#0A0518] p-2 rounded-xl border border-purple-900/30">
                      <span>Version: {installedData.version}</span>
                      <span>Added: {new Date(installedData.installedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(item.downloads / 1000000).toFixed(1)}M downloads
                  </span>

                  <div className="flex items-center gap-2">
                    {isInstalled ? (
                      <>
                        <button
                          onClick={() => handleUpdate(item.id, item.name)}
                          disabled={isBusy}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          title="Check for update"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                          <span>Update</span>
                        </button>
                        <button
                          onClick={() => handleUninstall(item.id, item.name)}
                          disabled={isBusy}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Uninstall</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInstall(item)}
                        disabled={!compat.compatible || isBusy}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          compat.compatible
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/50'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        } disabled:opacity-50`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'Installing...' : '1-Click Install'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
