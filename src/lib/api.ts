// API Client for INFHOST

const TOKEN_KEY = 'infhost_session_token';

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-session-token'] = token;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        errMessage = data.error || errMessage;
      } catch {
        // keep default
      }
    } else {
      const text = await res.text();
      if (text.trim().startsWith('<')) {
        if (res.status === 403) {
          errMessage = 'Access denied: Please verify user permissions or re-authenticate.';
        } else if (res.status === 401) {
          errMessage = 'Unauthorized session: Please log in.';
        } else if (res.status === 404) {
          errMessage = 'Resource endpoint not found.';
        } else {
          errMessage = `Request failed with server code ${res.status}`;
        }
      } else {
        errMessage = text || errMessage;
      }
    }

    if (res.status === 401 || (res.status === 403 && errMessage.toLowerCase().includes('session'))) {
      clearSessionToken();
    }

    throw new Error(errMessage);
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error(`Server returned HTML instead of JSON for ${endpoint}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  }

  return res.json();
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<{ user: any; credits: number }>('/api/user'),
  getUserCredits: () => request<{ balance: number; transactions: any[] }>('/api/user/credits'),

  // Nodes
  getNodes: () => request<{ totalNodes: number; onlineNodes: number; nodes: any[] }>('/api/nodes'),
  getNodeLocations: () => request<{ locations: any[] }>('/api/nodes/locations'),
  connectSimulatorNode: (location?: string, region?: string) =>
    request<any>('/api/admin/nodes/simulator-connect', { method: 'POST', body: JSON.stringify({ location, region }) }),

  // Servers
  getServers: (all = false) => request<{ servers: any[] }>(`/api/servers${all ? '?all=true' : ''}`),
  getServer: (id: string) => request<{ server: any; dnsStatus: any }>(`/api/servers/${id}`),
  createServer: (body: any) => request<{ success: boolean; server: any }>('/api/servers', { method: 'POST', body: JSON.stringify(body) }),
  deleteServer: (id: string) => request<any>(`/api/servers/${id}`, { method: 'DELETE' }),
  startServer: (id: string) => request<any>(`/api/servers/${id}/start`, { method: 'POST' }),
  stopServer: (id: string) => request<any>(`/api/servers/${id}/stop`, { method: 'POST' }),
  restartServer: (id: string) => request<any>(`/api/servers/${id}/restart`, { method: 'POST' }),
  killServer: (id: string) => request<any>(`/api/servers/${id}/kill`, { method: 'POST' }),

  // Console
  getConsoleLogs: (id: string) => request<{ logs: string[]; status: string }>(`/api/servers/${id}/console`),
  sendCommand: (id: string, command: string) => request<any>(`/api/servers/${id}/command`, { method: 'POST', body: JSON.stringify({ command }) }),

  // Files
  getFiles: (id: string, path = '') => request<{ files: any[] }>(`/api/servers/${id}/files?path=${encodeURIComponent(path)}`),
  getFileContent: (id: string, path: string) => request<{ content: string; name: string }>(`/api/servers/${id}/files/content?path=${encodeURIComponent(path)}`),
  saveFileContent: (id: string, path: string, content: string) => request<any>(`/api/servers/${id}/files/content`, { method: 'POST', body: JSON.stringify({ path, content }) }),
  createFile: (id: string, path: string, isDirectory: boolean, content?: string) => request<any>(`/api/servers/${id}/files/create`, { method: 'POST', body: JSON.stringify({ path, isDirectory, content }) }),
  deleteFile: (id: string, path: string) => request<any>(`/api/servers/${id}/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),

  // Backups
  getBackups: (id: string) => request<{ backups: any[] }>(`/api/servers/${id}/backups`),
  getBackupSchedule: (id: string) => request<{ schedule: any }>(`/api/servers/${id}/backups/schedule`),
  updateBackupSchedule: (id: string, body: any) => request<any>(`/api/servers/${id}/backups/schedule`, { method: 'POST', body: JSON.stringify(body) }),
  createBackup: (id: string) => request<any>(`/api/servers/${id}/backups`, { method: 'POST' }),
  restoreBackup: (id: string, bId: string) => request<any>(`/api/servers/${id}/backups/${bId}/restore`, { method: 'POST' }),
  deleteBackup: (id: string, bId: string) => request<any>(`/api/servers/${id}/backups/${bId}`, { method: 'DELETE' }),

  // Packages & Mods
  getServerPackages: (id: string) => request<{ packages: any[] }>(`/api/servers/${id}/packages`),
  installPackage: (id: string, packageId: string, type: 'plugin' | 'mod') => request<any>(`/api/servers/${id}/packages/install`, { method: 'POST', body: JSON.stringify({ packageId, type }) }),
  uninstallPackage: (id: string, packageId: string) => request<any>(`/api/servers/${id}/packages/uninstall`, { method: 'POST', body: JSON.stringify({ packageId }) }),
  updatePackage: (id: string, packageId: string) => request<any>(`/api/servers/${id}/packages/update`, { method: 'POST', body: JSON.stringify({ packageId }) }),

  // Resource Alerts
  getAlerts: (id: string) => request<{ settings: any; events: any[] }>(`/api/servers/${id}/alerts`),
  updateAlerts: (id: string, body: any) => request<any>(`/api/servers/${id}/alerts`, { method: 'POST', body: JSON.stringify(body) }),
  getAlertEvents: (id: string) => request<{ events: any[] }>(`/api/servers/${id}/alerts/events`),

  // Software & Marketplace
  getSoftware: () => request<{ software: any[] }>('/api/software'),
  getPlugins: () => request<{ plugins: any[] }>('/api/plugins'),
  getMods: () => request<{ mods: any[] }>('/api/mods'),

  // Credits & Billing
  redeemCode: (code: string) => request<{ success: boolean; creditsAdded: number; newBalance: number }>('/api/credits/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  earnCredits: () => request<any>('/api/credits/earn', { method: 'POST' }),
  getPlans: () => request<{ plans: any[] }>('/api/billing/plans'),
  getOrders: () => request<{ orders: any[] }>('/api/billing/orders'),
  createOrder: (body: any) => request<any>('/api/billing/orders', { method: 'POST', body: JSON.stringify(body) }),
  simulatePaymentWebhook: (orderId: string, event: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED') => request<any>('/api/billing/webhook', { method: 'POST', body: JSON.stringify({ orderId, event }) }),

  // Admin
  getAdminUsers: () => request<{ users: any[] }>('/api/admin/users'),
  suspendUser: (id: string) => request<any>(`/api/admin/users/${id}/suspend`, { method: 'POST' }),
  adjustUserCredits: (id: string, amount: number, reason: string) => request<any>(`/api/admin/users/${id}/credits`, { method: 'POST', body: JSON.stringify({ amount, reason }) }),
  getAdminNodes: () => request<{ nodes: any[] }>('/api/admin/nodes'),
  registerAdminNode: (body: any) => request<any>('/api/admin/nodes', { method: 'POST', body: JSON.stringify(body) }),
  deleteAdminNode: (id: string) => request<any>(`/api/admin/nodes/${id}`, { method: 'DELETE' }),
  getAdminRedeemCodes: () => request<{ codes: any[] }>('/api/admin/redeem-codes'),
  createAdminRedeemCode: (body: any) => request<any>('/api/admin/redeem-codes', { method: 'POST', body: JSON.stringify(body) }),
  toggleAdminRedeemCode: (code: string) => request<any>(`/api/admin/redeem-codes/${code}/toggle`, { method: 'POST' }),
  getAdminAuditLogs: () => request<{ logs: any[] }>('/api/admin/audit-logs')
};
