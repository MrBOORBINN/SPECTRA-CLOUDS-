// SupportView Component
// INFHOST Technical Help Desk, FAQ, Discord Community, and Infrastructure Diagnostics

import React from 'react';
import { Headphones, MessageSquare, ExternalLink, HelpCircle, Server, Terminal, ShieldCheck } from 'lucide-react';

export const SupportView: React.FC = () => {
  const faqs = [
    {
      q: 'Why does my server say "NO NODE CONNECTED"?',
      a: 'INFHOST enforces zero simulation. When no physical VPS or dedicated server is running the INFHOST node daemon with a valid heartbeat, servers cannot start. Administrators can add nodes in the Admin Panel or connect a test node.'
    },
    {
      q: 'How does port allocation work?',
      a: 'Each Minecraft server process is dynamically bound to an available port in the 25565-29999 range on the assigned VPS node. Addresses follow "server-name.infhost.net:PORT".'
    },
    {
      q: 'Can I edit server.properties and install plugins?',
      a: 'Yes. Use the Files tab to edit server.properties, eula.txt, spigot.yml, or upload plugins directly to the /plugins folder.'
    },
    {
      q: 'How do I redeem promotional credits?',
      a: 'Navigate to "Credits & Billing" or click Quick Actions → "Redeem Promo Code". Enter community codes such as INFHOST-WELCOME-100 or INFHOST-FREE-35.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Support Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#1E293B] bg-gradient-to-r from-[#0C1224] via-[#101733] to-[#1B1948] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Headphones className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider">
              24/7 SUPPORT NETWORK
            </span>
          </div>
          <h2 className="text-3xl font-black text-white font-display">How Can We Help You?</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Get instant assistance from the INFHOST team and community. Review documentation, diagnostics, or open a live ticket.
          </p>
        </div>

        <a
          href="https://discord.gg"
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 shadow-xl shadow-indigo-950/50 cursor-pointer shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Join Community Discord</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Diagnostics & FAQ Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FAQs */}
        <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#090D18] border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-white block">{f.q}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Infrastructure Health & Verification</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#090D18] border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Cluster Specification</span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Controller Version</span>
                  <span className="font-mono text-cyan-300">INFHOST Core v2.4</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Database Engine</span>
                  <span className="font-mono text-cyan-300">PostgreSQL (Prisma)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Node Protocol</span>
                  <span className="font-mono text-cyan-300">HTTPS / RPC Token</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Java Runtime</span>
                  <span className="font-mono text-cyan-300">OpenJDK 21 LTS</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D18] border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Official Support & Operations Contact</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                For business inquiries, enterprise node peering, or account recovery:
              </p>
              <a
                href="mailto:infbuisness01@gmail.com"
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-mono font-semibold"
              >
                <span>infbuisness01@gmail.com</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D18] border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Zero-Simulation Policy</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                INFHOST never outputs simulated player counts, fake IP ranges, or hallucinated Minecraft processes. When a node is unavailable, the interface reports exact diagnostic truth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
