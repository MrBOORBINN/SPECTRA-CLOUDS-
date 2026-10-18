/**
 * INFHOST — Host Beyond Limits
 * Production-oriented Minecraft server hosting platform
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { ServersView } from './components/ServersView';
import { CreateServerModal } from './components/CreateServerModal';
import { ServerDetailView } from './components/ServerDetailView';
import { CreditsView } from './components/CreditsView';
import { BillingView } from './components/BillingView';
import { AdminPanelView } from './components/AdminPanelView';
import { SupportView } from './components/SupportView';
import { AccountView } from './components/AccountView';
import { PluginsTab } from './components/PluginsTab';
import { ConsoleTab } from './components/ConsoleTab';
import { FileManagerTab } from './components/FileManagerTab';
import { BackupsTab } from './components/BackupsTab';
import { api } from './lib/api';
import { Node, Server } from './types';

function MainApp() {
  const { user, credits, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [connectingNode, setConnectingNode] = useState(false);

  // Live platform state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatformData = async () => {
    try {
      const [nRes, sRes] = await Promise.all([api.getNodes(), api.getServers()]);
      setNodes(nRes.nodes || []);
      setServers(sRes.servers || []);
    } catch (e) {
      console.error('Error fetching platform data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchPlatformData();
    const interval = setInterval(fetchPlatformData, 5000);
    return () => clearInterval(interval);
  }, [user?.id, authLoading]);

  const handleQuickConnectNode = async () => {
    setConnectingNode(true);
    try {
      await api.connectSimulatorNode('Germany', 'Europe');
      await fetchPlatformData();
    } catch (err: any) {
      alert('Node pairing error: ' + err.message);
    } finally {
      setConnectingNode(false);
    }
  };

  const handleStartServer = async (id: string) => {
    try {
      await api.startServer(id);
      await fetchPlatformData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStopServer = async (id: string) => {
    try {
      await api.stopServer(id);
      await fetchPlatformData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRestartServer = async (id: string) => {
    try {
      await api.restartServer(id);
      await fetchPlatformData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this Minecraft server?')) return;
    try {
      await api.deleteServer(id);
      if (selectedServer?.id === id) {
        setSelectedServer(null);
      }
      await fetchPlatformData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resolve target server for top-level console/files/backups tabs
  const defaultOrSelectedServer = selectedServer || servers[0] || null;

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Desktop Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'create') {
            setIsCreateModalOpen(true);
          } else {
            setCurrentTab(tab);
            setSelectedServer(null);
          }
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col flex-1 pb-16 lg:pb-8">
        {/* Sticky Header Bar */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={(tab) => {
            setCurrentTab(tab);
            setSelectedServer(null);
          }}
          activeNodesCount={nodes.filter((n) => n.status === 'ONLINE').length}
        />

        {/* Content Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {selectedServer ? (
            <ServerDetailView
              serverId={selectedServer.id}
              nodes={nodes}
              onBack={() => setSelectedServer(null)}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  nodes={nodes}
                  servers={servers}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onQuickConnectNode={handleQuickConnectNode}
                  connectingNode={connectingNode}
                  onOpenRedeemModal={() => setCurrentTab('credits')}
                />
              )}

              {currentTab === 'servers' && (
                <ServersView
                  servers={servers}
                  nodes={nodes}
                  onOpenCreate={() => setIsCreateModalOpen(true)}
                  onSelectServer={(s) => setSelectedServer(s)}
                  onStartServer={handleStartServer}
                  onStopServer={handleStopServer}
                  onRestartServer={handleRestartServer}
                  onDeleteServer={handleDeleteServer}
                />
              )}

              {currentTab === 'console' && (
                defaultOrSelectedServer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h2 className="text-xl font-bold text-white">Live Process Console</h2>
                        <p className="text-xs text-slate-400">Streaming STDOUT from {defaultOrSelectedServer.name}</p>
                      </div>
                      {servers.length > 1 && (
                        <select
                          value={defaultOrSelectedServer.id}
                          onChange={(e) => {
                            const found = servers.find((s) => s.id === e.target.value);
                            if (found) setSelectedServer(found);
                          }}
                          className="bg-[#090D18] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          {servers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.status})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <ConsoleTab server={defaultOrSelectedServer} onRefreshServer={fetchPlatformData} />
                  </div>
                ) : (
                  <div className="rounded-3xl glass-panel p-12 text-center text-slate-400 text-xs">
                    No servers created yet. Create a server first to access the interactive console.
                  </div>
                )
              )}

              {currentTab === 'files' && (
                defaultOrSelectedServer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h2 className="text-xl font-bold text-white">Server File Manager</h2>
                        <p className="text-xs text-slate-400">Jailed filesystem volume for {defaultOrSelectedServer.name}</p>
                      </div>
                      {servers.length > 1 && (
                        <select
                          value={defaultOrSelectedServer.id}
                          onChange={(e) => {
                            const found = servers.find((s) => s.id === e.target.value);
                            if (found) setSelectedServer(found);
                          }}
                          className="bg-[#090D18] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          {servers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <FileManagerTab server={defaultOrSelectedServer} />
                  </div>
                ) : (
                  <div className="rounded-3xl glass-panel p-12 text-center text-slate-400 text-xs">
                    No servers created yet. Create a server first to manage files.
                  </div>
                )
              )}

              {currentTab === 'backups' && (
                defaultOrSelectedServer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h2 className="text-xl font-bold text-white">Automated Backups</h2>
                        <p className="text-xs text-slate-400">Snapshots for {defaultOrSelectedServer.name}</p>
                      </div>
                      {servers.length > 1 && (
                        <select
                          value={defaultOrSelectedServer.id}
                          onChange={(e) => {
                            const found = servers.find((s) => s.id === e.target.value);
                            if (found) setSelectedServer(found);
                          }}
                          className="bg-[#090D18] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          {servers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <BackupsTab server={defaultOrSelectedServer} />
                  </div>
                ) : (
                  <div className="rounded-3xl glass-panel p-12 text-center text-slate-400 text-xs">
                    No servers created yet. Create a server first to schedule snapshots.
                  </div>
                )
              )}

              {currentTab === 'credits' && <CreditsView />}

              {currentTab === 'marketplace' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-black text-white font-display">Minecraft Marketplace</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Verified plugins, performance mods, and modpacks with real compatibility checks.
                    </p>
                  </div>
                  <PluginsTab server={defaultOrSelectedServer || ({ software: 'Paper', version: '1.21.4' } as any)} />
                </div>
              )}

              {currentTab === 'settings' && <AccountView />}

              {currentTab === 'support' && <SupportView />}

              {currentTab === 'admin' && (
                <AdminPanelView onRefreshNodes={fetchPlatformData} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedServer(null);
        }}
      />

      {/* Create Server Modal */}
      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        nodes={nodes}
        onServerCreated={() => {
          fetchPlatformData();
          setCurrentTab('servers');
        }}
        onGoToAdmin={() => setCurrentTab('admin')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
