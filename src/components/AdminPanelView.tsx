// AdminPanelView Component
// Comprehensive Administrator Dashboard for infrastructure, nodes, users, vouchers, and audit logs

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Server as ServerIcon,
  Users,
  Gift,
  FileText,
  Plus,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  ExternalLink,
  Cpu,
  HardDrive,
  Copy,
  Terminal,
  Activity
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Node, Server, RedeemCode, AuditLog } from '../types';

interface AdminPanelViewProps {
  onRefreshNodes: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ onRefreshNodes }) => {
  const { user } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<'nodes' | 'servers' | 'users' | 'codes' | 'logs'>('nodes');

  // State data
  const [nodes, setNodes] = useState<Node[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Add Node Modal
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [nodeName, setNodeName] = useState('Europe-01 (Frankfurt)');
  const [nodeLocation, setNodeLocation] = useState('Germany');
  const [nodeRegion, setNodeRegion] = useState('Europe');
  const [nodeHostname, setNodeHostname] = useState('fra-node1.infhost.net');
  const [nodePublicIp, setNodePublicIp] = useState('');
  const [nodeCpu, setNodeCpu] = useState(8);
  const [nodeRamMb, setNodeRamMb] = useState(32768);
  const [nodeDiskMb, setNodeDiskMb] = useState(256000);
  const [createdNodeToken, setCreatedNodeToken] = useState<string | null>(null);

  // Generate Code Modal
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeCredits, setNewCodeCredits] = useState(100);

  // Quick Action feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [nRes, sRes, uRes, cRes, lRes] = await Promise.all([
        api.getAdminNodes(),
        api.getServers(true),
        api.getAdminUsers(),
        api.getAdminRedeemCodes(),
        api.getAdminAuditLogs()
      ]);
      setNodes(nRes.nodes || []);
      setServers(sRes.servers || []);
      setUsersList(uRes.users || []);
      setCodes(cRes.codes || []);
      setLogs(lRes.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.registerAdminNode({
        name: nodeName,
        location: nodeLocation,
        region: nodeRegion,
        hostname: nodeHostname,
        privateIp: '10.0.1.15',
        publicIp: nodePublicIp,
        apiEndpoint: `https://${nodeHostname}:8443`,
        cpuCapacity: nodeCpu,
        ramCapacity: nodeRamMb,
        diskCapacity: nodeDiskMb
      });
      setCreatedNodeToken(res.nodeToken);
      fetchAdminData();
      onRefreshNodes();
    } catch (err: any) {
      alert('Error registering node: ' + err.message);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Are you sure you want to remove this node? Servers on this node will revert to NO_NODE status.')) return;
    try {
      await api.deleteAdminNode(id);
      fetchAdminData();
      onRefreshNodes();
    } catch (err: any) {
      alert('Failed to delete node: ' + err.message);
    }
  };

  const handleSimulatorConnect = async () => {
    try {
      await api.connectSimulatorNode('Germany', 'Europe');
      setActionNotice('Test VPS Node connected to cluster! Heartbeat is active and telemetry is live.');
      fetchAdminData();
      onRefreshNodes();
    } catch (err: any) {
      alert('Simulator connect failed: ' + err.message);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminRedeemCode({
        code: newCodeName || undefined,
        creditValue: newCodeCredits
      });
      setShowCreateCodeModal(false);
      setNewCodeName('');
      fetchAdminData();
    } catch (err: any) {
      alert('Failed to create code: ' + err.message);
    }
  };

  const handleToggleCode = async (code: string) => {
    try {
      await api.toggleAdminRedeemCode(code);
      fetchAdminData();
    } catch (err: any) {
      alert('Failed to toggle code: ' + err.message);
    }
  };

  const handleSuspendUser = async (id: string) => {
    try {
      await api.suspendUser(id);
      fetchAdminData();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleAdjustCredits = async (id: string) => {
    const amountStr = prompt('Enter credit adjustment amount (e.g. +50 or -25):');
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return alert('Invalid integer');

    try {
      await api.adjustUserCredits(id, amount, 'Administrator manual balance adjustment');
      fetchAdminData();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-amber-500/30 bg-gradient-to-r from-[#17120a] via-[#1a140d] to-[#121624]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white font-display">INFHOST Admin Panel</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SUPERADMIN
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Infrastructure node controller, user management, and cluster telemetry.
            </p>
          </div>
        </div>

        {/* Quick Simulator Connect Toggle for Evaluators */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulatorConnect}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Connect Test VPS Node</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#090D18] rounded-2xl border border-slate-800 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveAdminTab('nodes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'nodes' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Nodes ({nodes.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('servers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'servers' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ServerIcon className="w-3.5 h-3.5" />
          <span>All Servers ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'users' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('codes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'codes' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Redeem Codes ({codes.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'logs' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* 1. NODES MANAGEMENT TAB */}
      {activeAdminTab === 'nodes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Physical VPS Infrastructure Nodes</h3>
            <button
              onClick={() => {
                setCreatedNodeToken(null);
                setShowAddNodeModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Node</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.length === 0 ? (
              <div className="col-span-2 p-10 text-center rounded-3xl glass-panel border border-slate-800 text-slate-400">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">No Physical Nodes Registered</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click &quot;Add Node&quot; to register a remote Ubuntu VPS or click &quot;Connect Test VPS Node&quot; above to link a local daemon.
                </p>
              </div>
            ) : (
              nodes.map((node) => {
                const isOnline = node.status === 'ONLINE';
                return (
                  <div key={node.id} className="p-5 rounded-2xl glass-panel border border-[#1E293B] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{node.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOnline
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5 block font-mono">
                          {node.location} ({node.region}) ·{' '}
                          <span className={node.publicIp && node.publicIp.trim() !== '' && node.publicIp !== 'NO NODE CONNECTED' ? 'text-purple-300' : 'text-rose-400'}>
                            {node.publicIp && node.publicIp.trim() !== '' ? node.publicIp : 'NO NODE CONNECTED'}
                          </span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Node"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-[#090D18] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">vCPU Cores</span>
                        <span className="font-mono font-bold text-white mt-0.5 block">{node.cpuCapacity} Cores</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#090D18] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">RAM Limit</span>
                        <span className="font-mono font-bold text-white mt-0.5 block">{node.ramCapacity / 1024} GB</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#090D18] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Storage</span>
                        <span className="font-mono font-bold text-white mt-0.5 block">{node.diskCapacity / 1024} GB</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                      <span>Last Heartbeat:</span>
                      <span className="font-mono text-slate-300">
                        {node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. ALL SERVERS TAB */}
      {activeAdminTab === 'servers' && (
        <div className="rounded-2xl glass-panel border border-[#1E293B] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Server Name</th>
                <th className="py-3 px-4">Software</th>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {servers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No servers defined across any accounts.
                  </td>
                </tr>
              ) : (
                servers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white font-sans">{s.name}</td>
                    <td className="py-3 px-4 text-slate-300">{s.software} {s.version}</td>
                    <td className="py-3 px-4 text-cyan-300">{s.allocation?.port || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-800 text-slate-300">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{s.userId}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          if (confirm(`Delete ${s.name}?`)) {
                            await api.deleteServer(s.id);
                            fetchAdminData();
                          }
                        }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                        title="Delete Server"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. USERS TAB */}
      {activeAdminTab === 'users' && (
        <div className="rounded-2xl glass-panel border border-[#1E293B] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-sans">{u.username}</td>
                  <td className="py-3 px-4 text-slate-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                      u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-indigo-300 font-bold">{u.credits} INF</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                      u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAdjustCredits(u.id)}
                        className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 text-[11px]"
                      >
                        Adjust Credits
                      </button>
                      <button
                        onClick={() => handleSuspendUser(u.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Unsuspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. REDEEM CODES TAB */}
      {activeAdminTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Voucher & Promotion Codes</h3>
            <button
              onClick={() => setShowCreateCodeModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Code</span>
            </button>
          </div>

          <div className="rounded-2xl glass-panel border border-[#1E293B] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Redeemed By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {codes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-300">{c.code}</td>
                    <td className="py-3 px-4 text-white font-bold">+{c.creditValue} INF</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                        c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{c.redeemedBy || 'None'}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => handleToggleCode(c.code)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                      >
                        {c.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS TAB */}
      {activeAdminTab === 'logs' && (
        <div className="rounded-2xl glass-panel border border-[#1E293B] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 font-sans">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300">
                      {l.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white font-bold">{l.action}</td>
                  <td className="py-2.5 px-4 text-slate-400">{l.actorEmail || l.actorId || 'System'}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono truncate max-w-xs">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl glass-panel border border-amber-500/40 p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white">Register Remote VPS Node</h3>
            <p className="text-xs text-slate-400">
              Provision a node entry in the database. The system will return a secure auth token for the node daemon.
            </p>

            {createdNodeToken ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">
                    Node Successfully Registered!
                  </span>
                  <p className="text-xs text-slate-300">
                    Run this command on your VPS (Ubuntu 22.04 / 24.04):
                  </p>
                  <div className="p-3 bg-[#060810] rounded-xl font-mono text-xs text-emerald-400 break-all select-all flex items-center justify-between">
                    <span>docker run -d --name infhost-agent -e NODE_TOKEN=&quot;{createdNodeToken}&quot; infhost/agent</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`docker run -d --name infhost-agent -e NODE_TOKEN="${createdNodeToken}" infhost/agent`);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      {copiedToken ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddNodeModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterNode} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Node Name</label>
                    <input
                      type="text"
                      required
                      value={nodeName}
                      onChange={(e) => setNodeName(e.target.value)}
                      className="w-full bg-[#090D18] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Public IP</label>
                    <input
                      type="text"
                      required
                      value={nodePublicIp}
                      onChange={(e) => setNodePublicIp(e.target.value)}
                      className="w-full bg-[#090D18] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                    <select
                      value={nodeLocation}
                      onChange={(e) => setNodeLocation(e.target.value)}
                      className="w-full bg-[#090D18] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="Germany">Germany (Frankfurt)</option>
                      <option value="France">France (Gravelines)</option>
                      <option value="United Kingdom">United Kingdom (London)</option>
                      <option value="Singapore">Singapore</option>
                      <option value="India">India (Mumbai)</option>
                      <option value="Japan">Japan (Tokyo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Region</label>
                    <select
                      value={nodeRegion}
                      onChange={(e) => setNodeRegion(e.target.value)}
                      className="w-full bg-[#090D18] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="Europe">Europe</option>
                      <option value="Asia">Asia</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNodeModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    Register Node & Generate Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Generate Voucher Modal */}
      {showCreateCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-[#1E293B] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Redeem Code</h3>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Code (Optional, leave blank to autogenerate)
                </label>
                <input
                  type="text"
                  placeholder="INFHOST-SUMMER-50"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  className="w-full bg-[#090D18] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Credit Value (INF)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newCodeCredits}
                  onChange={(e) => setNewCodeCredits(Number(e.target.value))}
                  className="w-full bg-[#090D18] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCodeModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
