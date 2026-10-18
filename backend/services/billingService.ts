// Billing & Invoicing Service
// Manages plans, orders, and payment gateway webhooks (with Sandbox support)

import crypto from 'crypto';
import { db } from '../db';
import { Order, Plan, PaymentStatus } from '../types';
import { creditsService } from './creditsService';

export class BillingService {
  public getPlans(): Plan[] {
    return Array.from(db.plans.values()).filter(p => p.active);
  }

  public getPlanById(id: string): Plan | undefined {
    return db.plans.get(id);
  }

  public getUserOrders(userId: string): Order[] {
    const list: Order[] = [];
    for (const o of db.orders.values()) {
      if (o.userId === userId) {
        list.push(o);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createOrder(data: {
    userId: string;
    planId?: string;
    amount: number;
    currency: 'INR' | 'USD' | 'CREDITS';
    provider: string;
  }): Order {
    const orderId = 'ord_' + crypto.randomBytes(4).toString('hex');
    const order: Order = {
      id: orderId,
      userId: data.userId,
      planId: data.planId,
      amount: data.amount,
      currency: data.currency,
      status: 'PENDING',
      provider: data.provider,
      providerRef: 'sandbox_ref_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString()
    };

    db.orders.set(order.id, order);
    db.logAudit('PAYMENT', 'CREATE_ORDER', data.userId, { orderId: order.id, amount: data.amount, currency: data.currency });
    return order;
  }

  public processWebhook(payload: {
    orderId: string;
    event: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
    signature?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const order = db.orders.get(payload.orderId);
    if (!order) return { success: false, error: 'Order not found' };

    if (payload.event === 'PAYMENT_SUCCESS') {
      order.status = 'PAID';
      // If purchase was for credits
      if (order.planId) {
        const plan = db.plans.get(order.planId);
        if (plan) {
          creditsService.adjustCredits(
            order.userId,
            plan.priceCredits,
            'PURCHASE',
            `Purchased ${plan.name} Plan pack (${plan.priceCredits} INF Credits)`,
            order.id
          );
        }
      }
      db.logAudit('PAYMENT', 'PAYMENT_SUCCESS', order.userId, { orderId: order.id, amount: order.amount });
      return { success: true, order };
    } else {
      order.status = 'FAILED';
      db.logAudit('PAYMENT', 'PAYMENT_FAILED', order.userId, { orderId: order.id });
      return { success: true, order };
    }
  }

  // Admin Plan Management
  public createPlan(data: Omit<Plan, 'id'>, adminId: string): Plan {
    const id = 'plan_' + crypto.randomBytes(4).toString('hex');
    const plan: Plan = {
      ...data,
      id
    };
    db.plans.set(id, plan);
    db.logAudit('ADMIN', 'CREATE_PLAN', adminId, { planId: id, name: plan.name });
    return plan;
  }

  public updatePlan(id: string, updates: Partial<Plan>, adminId: string): Plan | null {
    const p = db.plans.get(id);
    if (!p) return null;
    Object.assign(p, updates);
    db.logAudit('ADMIN', 'UPDATE_PLAN', adminId, { planId: id, updates });
    return p;
  }
}

export const billingService = new BillingService();
