// CreditsView Component
// Authoritative server-side credit balance, voucher redemption, and Earn Credits architecture

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Zap,
  Gift,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Video
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { CreditTransaction } from '../types';

export const CreditsView: React.FC = () => {
  const { user, credits, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.getUserCredits();
      setTransactions(res.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [credits]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;

    setRedeeming(true);
    setRedeemResult(null);

    try {
      const res = await api.redeemCode(redeemInput.trim());
      setRedeemResult({
        success: true,
        message: `Successfully redeemed! Added +${res.creditsAdded} INF Credits to your balance.`
      });
      setRedeemInput('');
      await refreshUser();
      fetchHistory();
    } catch (err: any) {
      setRedeemResult({
        success: false,
        message: err.message || 'Failed to redeem code'
      });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Balance */}
      <div className="rounded-3xl glass-panel border border-[#1E293B] bg-gradient-to-r from-[#0E1328] via-[#121A38] to-[#1A1844] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-widest block mb-1">
            AUTHORITATIVE BALANCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
            INFHOST Credits
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Credits power your Minecraft servers, automated backups, and hardware upgrades. Every transaction is stored securely in the PostgreSQL ledger.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090D18]/90 border border-indigo-500/30 flex items-center gap-4 shrink-0 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Available Balance</span>
            <span className="text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {credits} <span className="text-base text-indigo-400 font-sans font-bold">INF</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Redeem Code Section (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Redeem Promo Code</h3>
                <p className="text-xs text-slate-400">Claim official promotional credit codes</p>
              </div>
            </div>

            {redeemResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  redeemResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {redeemResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{redeemResult.message}</span>
              </div>
            )}

            <form onSubmit={handleRedeem} className="space-y-3">
              <input
                type="text"
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                placeholder="INFHOST-XXXX-XXXX"
                className="w-full bg-[#0A0518] border border-purple-900/40 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 uppercase"
              />

              <button
                type="submit"
                disabled={redeeming || !redeemInput.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/40 cursor-pointer disabled:opacity-40"
              >
                {redeeming ? 'Verifying Code...' : 'Redeem Code'}
              </button>
            </form>

            {/* Test Codes Helpers */}
            <div className="pt-3 border-t border-purple-900/30 text-xs">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                Active Verified Voucher Codes (Click to apply):
              </span>
              <div className="space-y-1.5">
                {[
                  { code: 'INFHOST-DIRT-0390', val: '+390 Credits' },
                  { code: 'INFHOST-STON-0690', val: '+690 Credits' },
                  { code: 'INFHOST-COPP-1190', val: '+1,190 Credits' },
                  { code: 'INFHOST-FREE-1000', val: '+1,000 Credits' }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setRedeemInput(item.code)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-[#0A0518] hover:bg-purple-950/40 border border-purple-900/30 text-slate-300 text-[11px] font-mono transition-colors text-left cursor-pointer"
                  >
                    <span>{item.code}</span>
                    <span className="text-purple-300 font-sans font-bold">{item.val}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Earn Credits Architecture */}
          <div className="rounded-3xl glass-panel border border-purple-900/30 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Earn Free Credits</h3>
                <p className="text-xs text-slate-400">Claim activity rewards and partner campaigns</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Earn free credits to renew or upgrade your Minecraft server. Validated on server-side ledger.
            </p>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#0A0518] border border-purple-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-bold text-white block">Daily Activity Bonus</span>
                    <span className="text-[10px] text-slate-400">+25 INF Credits every 24h</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.earnCredits();
                      await refreshUser();
                      fetchHistory();
                      alert('Claimed +25 INF Credits!');
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Claim +25
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Ledger (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Credits Ledger</span>
                </h3>
                <p className="text-xs text-slate-400">Cryptographically verifiable account history</p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {transactions.length} Records
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/60 font-mono text-xs">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-sans">
                  No credit transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="py-3 px-1 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-white font-sans font-semibold block">{tx.description}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-sans">
                        <span>Source: {tx.source}</span>
                        <span>·</span>
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold tabular-nums block ${
                          tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} INF
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Bal: {tx.balanceAfter} INF
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
