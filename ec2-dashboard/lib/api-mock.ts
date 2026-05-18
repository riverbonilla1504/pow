import { loadDb, saveDb, uid, type MockDb, type MockUser } from './mock-store';

const MOCK_QR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#0f1020" width="200" height="200"/><text x="100" y="105" text-anchor="middle" fill="#42b883" font-size="14" font-family="monospace">MOCK 2FA QR</text></svg>',
  );

function delay(ms = 120) {
  return new Promise((r) => setTimeout(r, ms));
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function setToken(token: string) {
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `token=${encodeURIComponent(token)};path=/;max-age=3600;SameSite=Lax${secure}`;
}

export function clearToken() {
  document.cookie = 'token=;path=/;max-age=0';
}

export function hasToken(): boolean {
  return !!getToken();
}

function signToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'mock' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `${header}.${body}.mock`;
}

export function getTokenPayload(): Record<string, unknown> | null {
  const t = getToken();
  if (!t) return null;
  try {
    return JSON.parse(atob(t.split('.')[1]));
  } catch {
    return null;
  }
}

function currentUser(db: MockDb): MockUser | null {
  const payload = getTokenPayload();
  if (!payload?.sub) return null;
  return db.users.find((u) => u.id === payload.sub) ?? null;
}

function tokenForUser(user: MockUser, opts?: { twoFactorVerified?: boolean; scope?: string }) {
  return signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    twoFactorVerified: opts?.twoFactorVerified ?? !user.totp_enabled,
    ...(opts?.scope ? { scope: opts.scope } : {}),
  });
}

function findUser(db: MockDb, email: string, password: string) {
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) return null;
  return user;
}

export async function login(email: string, password: string) {
  await delay();
  const db = loadDb();
  const user = findUser(db, email, password);
  if (!user) throw new Error('Invalid credentials');

  if (user.totp_enabled) {
    return {
      requires2FA: true,
      tempToken: signToken({ sub: user.id, scope: '2fa_pending' }),
    };
  }

  return {
    token: tokenForUser(user, { twoFactorVerified: user.role !== 'admin' }),
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function register(email: string, password: string, phone?: string) {
  await delay();
  const db = loadDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  const user: MockUser = {
    id: uid(),
    email,
    password,
    role: 'cliente',
    phone: phone || null,
    totp_enabled: false,
    totp_secret: null,
    backup_codes: [],
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  saveDb(db);
  const token = tokenForUser(user, { twoFactorVerified: true });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function verify2fa(code: string, tempToken: string) {
  await delay();
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid 2FA code');
  let payload: { sub?: string; scope?: string };
  try {
    payload = JSON.parse(atob(tempToken.split('.')[1]));
  } catch {
    throw new Error('Invalid token scope');
  }
  if (payload.scope !== '2fa_pending' || !payload.sub) throw new Error('Invalid token scope');

  const db = loadDb();
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user) throw new Error('User not found');

  const token = tokenForUser(user, { twoFactorVerified: true });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function enroll2fa() {
  await delay();
  const db = loadDb();
  const user = currentUser(db);
  if (!user) throw new Error('Unauthorized');
  user.totp_secret = 'MOCKSECRET';
  saveDb(db);
  return { secret: 'MOCKSECRET', qrCode: MOCK_QR };
}

export async function confirm2fa(code: string) {
  await delay();
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid code, try again');
  const db = loadDb();
  const user = currentUser(db);
  if (!user?.totp_secret) throw new Error('Must enroll first');
  user.totp_enabled = true;
  if (user.backup_codes.length === 0) {
    user.backup_codes = ['mock0001', 'mock0002', 'mock0003', 'mock0004'];
  }
  saveDb(db);
  return {
    message: '2FA activated',
    backupCodes: user.backup_codes,
    warning: 'Save these codes securely. They will not be shown again.',
  };
}

export async function recover2fa(email: string, password: string, backupCode: string) {
  await delay();
  const db = loadDb();
  const user = findUser(db, email, password);
  if (!user) throw new Error('Invalid credentials');
  const idx = user.backup_codes.indexOf(backupCode);
  if (idx === -1) throw new Error('Invalid backup code');
  user.backup_codes = user.backup_codes.filter((_, i) => i !== idx);
  saveDb(db);
  const token = tokenForUser(user, { twoFactorVerified: true });
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
    remainingBackupCodes: user.backup_codes.length,
  };
}

export async function getMe() {
  await delay();
  const db = loadDb();
  const user = currentUser(db);
  if (!user) throw new Error('Unauthorized');
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    phone: user.phone,
    totp_enabled: user.totp_enabled,
  };
}

export async function myOrders() {
  await delay();
  const db = loadDb();
  const user = currentUser(db);
  if (!user) throw new Error('Unauthorized');
  const orders = db.orders
    .filter((o) => o.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { orders };
}

export async function createOrder(items: unknown[], total: number) {
  await delay();
  const db = loadDb();
  const user = currentUser(db);
  if (!user) throw new Error('Unauthorized');

  const order = {
    id: uid(),
    user_id: user.id,
    items,
    total: String(total),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_email: user.email,
    user_phone: user.phone,
  };
  db.orders.unshift(order);

  db.notifications.unshift({
    id: uid(),
    order_id: order.id,
    type: 'email',
    status: 'sent',
    recipient: user.email,
    template: 'order_created',
    error_message: null,
    created_at: new Date().toISOString(),
  });
  if (total > 500 && user.phone) {
    db.notifications.unshift({
      id: uid(),
      order_id: order.id,
      type: 'sms',
      status: 'sent',
      recipient: user.phone,
      template: 'high_value_order',
      error_message: null,
      created_at: new Date().toISOString(),
    });
  }
  saveDb(db);
  return { order };
}

export async function adminDashboard() {
  await delay();
  const db = loadDb();
  const statusCounts: Record<string, number> = {};
  for (const o of db.orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

  const roleCounts: Record<string, number> = {};
  for (const u of db.users) roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;

  const notifStats: { type: string; status: string; count: string }[] = [];
  const notifMap: Record<string, number> = {};
  for (const n of db.notifications) {
    const key = `${n.type}|${n.status}`;
    notifMap[key] = (notifMap[key] || 0) + 1;
  }
  for (const [key, count] of Object.entries(notifMap)) {
    const [type, status] = key.split('|');
    notifStats.push({ type, status, count: String(count) });
  }

  const recentOrders = [...db.orders]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  const totalRevenue = db.orders.reduce((s, o) => s + parseFloat(o.total), 0);

  return {
    ordersByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count: String(count) })),
    usersByRole: Object.entries(roleCounts).map(([role, count]) => ({ role, count: String(count) })),
    recentOrders,
    notificationStats: notifStats,
    totalRevenue,
  };
}

export async function adminOrders(page = 1, limit = 15, status?: string) {
  await delay();
  const db = loadDb();
  let list = [...db.orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) list = list.filter((o) => o.status === status);
  const total = list.length;
  const offset = (page - 1) * limit;
  const orders = list.slice(offset, offset + limit);
  return { orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function adminNotifications(page = 1, limit = 20, type?: string, status?: string) {
  await delay();
  const db = loadDb();
  let list = [...db.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (type) list = list.filter((n) => n.type === type);
  if (status) list = list.filter((n) => n.status === status);
  const total = list.length;
  const offset = (page - 1) * limit;
  return {
    notifications: list.slice(offset, offset + limit),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function adminDLQ() {
  await delay();
  const db = loadDb();
  return db.dlq;
}

export async function adminUsers(page = 1, limit = 20) {
  await delay();
  const db = loadDb();
  const sorted = [...db.users].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = sorted.length;
  const offset = (page - 1) * limit;
  const users = sorted.slice(offset, offset + limit).map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    two_factor_enabled: u.totp_enabled,
    phone: u.phone,
    created_at: u.created_at,
  }));
  return { users, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function updateRole(id: string, role: string) {
  await delay();
  const valid = ['cliente', 'operador', 'admin'];
  if (!valid.includes(role)) throw new Error(`Role must be one of: ${valid.join(', ')}`);
  const db = loadDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new Error('User not found');
  user.role = role as MockUser['role'];
  saveDb(db);
  return { user: { id: user.id, email: user.email, role: user.role } };
}

export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('admin.');
}

export function loginUrl(): string {
  return '/login';
}

export function postLoginPath(role: string): string {
  if (isAdminHost()) return role === 'admin' ? '/' : '/login';
  return '/dashboard';
}

export function adminHomePath(): string {
  return isAdminHost() ? '/' : '/admin';
}

export function isAdminRole(role: unknown): boolean {
  return role === 'admin';
}
