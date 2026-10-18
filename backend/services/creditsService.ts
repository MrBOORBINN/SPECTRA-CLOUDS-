// Credits & Wallet Service
// Server-authoritative credit storage and redeem code engine

import crypto from 'crypto';
import { db } from '../db';
import { CreditWallet, CreditTransaction, RedeemCode } from '../types';

export class CreditsService {
  public getOrCreateWallet(userId: string): CreditWallet {
    let wallet = Array.from(db.wallets.values()).find(w => w.userId === userId);
    if (!wallet) {
      wallet = {
        id: 'wal_' + crypto.randomBytes(4).toString('hex'),
        userId,
        balance: 0,
        updatedAt: new Date().toISOString()
      };
      db.wallets.set(wallet.id, wallet);
      db.creditTransactions.set(wallet.id, []);
    }
    return wallet;
  }

  public getTransactions(userId: string): CreditTransaction[] {
    const wallet = this.getOrCreateWallet(userId);
    return db.creditTransactions.get(wallet.id) || [];
  }

  public adjustCredits(
    userId: string,
    amount: number,
    source: CreditTransaction['source'],
    description: string,
    referenceId?: string
  ): { success: boolean; newBalance: number; error?: string } {
    const wallet = this.getOrCreateWallet(userId);

    if (amount < 0 && wallet.balance + amount < 0) {
      return { success: false, newBalance: wallet.balance, error: 'Insufficient INF credits balance.' };
    }

    wallet.balance += amount;
    wallet.updatedAt = new Date().toISOString();

    const tx: CreditTransaction = {
      id: 'ctx_' + crypto.randomBytes(5).toString('hex'),
      walletId: wallet.id,
      userId,
      amount,
      balanceAfter: wallet.balance,
      source,
      description,
      referenceId,
      createdAt: new Date().toISOString()
    };

    const txs = db.creditTransactions.get(wallet.id) || [];
    txs.unshift(tx);
    db.creditTransactions.set(wallet.id, txs);

    db.logAudit('CREDITS', amount >= 0 ? 'CREDITS_ADDED' : 'CREDITS_DEDUCTED', userId, {
      amount,
      balanceAfter: wallet.balance,
      source,
      description
    });

    return { success: true, newBalance: wallet.balance };
  }

  public redeemCode(userId: string, rawCode: string): { success: boolean; creditsAdded?: number; error?: string } {
    const codeKey = rawCode.trim().toUpperCase();
    const code = db.redeemCodes.get(codeKey);

    if (!code) {
      return { success: false, error: 'Invalid or non-existent redeem code.' };
    }

    if (code.status === 'REDEEMED') {
      return { success: false, error: 'This redeem code has already been redeemed.' };
    }

    if (code.status === 'EXPIRED' || (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now())) {
      code.status = 'EXPIRED';
      return { success: false, error: 'This redeem code has expired.' };
    }

    if (code.status === 'DISABLED') {
      return { success: false, error: 'This redeem code has been disabled by an administrator.' };
    }

    // Mark as redeemed
    code.status = 'REDEEMED';
    code.redeemedBy = userId;
    code.redeemedAt = new Date().toISOString();

    // Credit user's wallet
    this.adjustCredits(
      userId,
      code.creditValue,
      'REDEEM_CODE',
      `Redeemed code ${code.code}`,
      code.code
    );

    return { success: true, creditsAdded: code.creditValue };
  }

  // Admin Code Management
  public getAllCodes(): RedeemCode[] {
    return Array.from(db.redeemCodes.values());
  }

  public createCode(data: {
    code?: string;
    creditValue: number;
    expiresAt?: string | null;
  }, adminId: string): RedeemCode {
    const generatedCode = data.code
      ? data.code.trim().toUpperCase()
      : 'INFHOST-' + crypto.randomBytes(2).toString('hex').toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    const code: RedeemCode = {
      id: 'code_' + crypto.randomBytes(4).toString('hex'),
      code: generatedCode,
      creditValue: data.creditValue,
      status: 'ACTIVE',
      expiresAt: data.expiresAt || null,
      createdBy: adminId,
      redeemedBy: null,
      redeemedAt: null,
      createdAt: new Date().toISOString()
    };

    db.redeemCodes.set(code.code, code);
    db.logAudit('ADMIN', 'CREATE_REDEEM_CODE', adminId, { code: code.code, creditValue: data.creditValue });
    return code;
  }

  public toggleCodeStatus(codeKey: string, adminId: string): boolean {
    const c = db.redeemCodes.get(codeKey);
    if (!c) return false;
    c.status = c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    db.logAudit('ADMIN', 'TOGGLE_REDEEM_CODE', adminId, { code: c.code, newStatus: c.status });
    return true;
  }
}

export const creditsService = new CreditsService();
