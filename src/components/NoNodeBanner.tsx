// NoNodeBanner Component
// Truthful infrastructure state banner when no physical VPS node is registered

import React from 'react';
import { AlertTriangle, Server, ArrowRight, ShieldCheck } from 'lucide-react';

interface NoNodeBannerProps {
  onGoToAdmin?: () => void;
  onQuickConnectTestNode?: () => void;
  connecting?: boolean;
}

export const NoNodeBanner: React.FC<NoNodeBannerProps> = ({
  onGoToAdmin,
  onQuickConnectTestNode,
  connecting = false
}) => {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                NO NODE CONNECTED
              </span>
              <span className="text-xs text-slate-400">· Zero Simulation Policy</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              No Physical VPS Node is Currently Linked to INFHOST
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              INFHOST does not fabricate fake servers, fake IP addresses, or simulated processes. Server creation and execution are locked until an active VPS node agent establishes a heartbeat connection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {onQuickConnectTestNode && (
            <button
              onClick={onQuickConnectTestNode}
              disabled={connecting}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{connecting ? 'Connecting...' : 'Connect Test VPS Node'}</span>
            </button>
          )}

          {onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Node Setup</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
