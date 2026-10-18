// BillingView Component
// Tiered plan subscriptions, sandbox payment gateway simulator, and invoice history

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  Crown
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plan, Order } from '../types';

export const BillingView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'CREDITS'>('INR');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([api.getPlans(), api.getOrders()]);
      setPlans(pRes.plans || []);
      setOrders(oRes.orders || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleCheckout = async (plan: Plan) => {
    setSelectedPlan(plan);
    setProcessingOrder(true);
    setCheckoutResult(null);

    try {
      // 1. Create Order
      const res = await api.createOrder({
        planId: plan.id,
        amount: plan.priceInr,
        currency,
        provider: 'SANDBOX_GATEWAY'
      });

      // 2. Simulate Payment Provider Webhook Confirmation
      await api.simulatePaymentWebhook(res.order.id, 'PAYMENT_SUCCESS');
      await refreshUser();
      await fetchBillingData();
      setCheckoutResult(`Payment verified! ${plan.priceCredits} INF Credits added to your account.`);
    } catch (err: any) {
      alert('Order failed: ' + err.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  const getPriceLabel = (p: Plan) => {
    if (currency === 'INR') return `₹${p.priceInr}/mo`;
    if (currency === 'USD') return `$${(p.priceInr / 85).toFixed(2)}/mo`;
    return `${p.priceCredits} INF/mo`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-[#1E293B]">
        <div>
          <h2 className="text-2xl font-black text-white font-display">Hosting Plans & Billing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Predictable resource pricing with instant activation. Switch between INR, USD, and INF Credits.
          </p>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#090D18] rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currency === 'INR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency('CREDITS')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currency === 'CREDITS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            INF Credits
          </button>
        </div>
      </div>

      {checkoutResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{checkoutResult}</span>
          </div>
          <button onClick={() => setCheckoutResult(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isIron = p.slug === 'iron';
          return (
            <div
              key={p.id}
              className={`rounded-3xl glass-panel p-6 flex flex-col justify-between relative transition-all ${
                isIron
                  ? 'border-purple-500/50 bg-gradient-to-b from-[#1C1138] to-[#0E0722] shadow-xl shadow-purple-950/40'
                  : 'border-purple-900/30 hover:border-purple-500/40'
              }`}
            >
              {isIron && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold tracking-wider uppercase">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    +{p.priceCredits} Credits
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>

                <div className="mt-6 mb-6">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {getPriceLabel(p)}
                  </span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{p.ramMb / 1024} GB</strong> Dedicated RAM</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{p.cpuCores}</strong> vCPU Cores</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{p.storageMb / 1024} GB</strong> NVMe SSD Storage</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{p.backupLimit}</strong> Automated Backups</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Player Slots</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCheckout(p)}
                disabled={processingOrder}
                className="mt-8 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{processingOrder ? 'Processing...' : 'Subscribe / Checkout'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice & Orders History Table */}
      <div className="rounded-3xl glass-panel border border-[#1E293B] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Invoices & Order Records</span>
            </h3>
            <p className="text-xs text-slate-400">Past payment orders and transactions</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{orders.length} Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-indigo-300 font-bold">{o.id}</td>
                    <td className="py-2.5 px-3 text-white">
                      {o.currency} {o.amount}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{o.provider}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-sans">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
