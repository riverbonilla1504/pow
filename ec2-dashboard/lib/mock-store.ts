const DB_KEY = 'freck_mock_db';

export type MockUser = {
  id: string;
  email: string;
  password: string;
  role: 'cliente' | 'operador' | 'admin';
  phone: string | null;
  totp_enabled: boolean;
  totp_secret: string | null;
  backup_codes: string[];
  created_at: string;
};

export type MockOrder = {
  id: string;
  user_id: string;
  items: unknown;
  total: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_phone?: string | null;
};

export type MockNotification = {
  id: string;
  order_id: string | null;
  type: string;
  status: string;
  recipient: string;
  template: string;
  error_message: string | null;
  created_at: string;
};

export type MockDb = {
  users: MockUser[];
  orders: MockOrder[];
  notifications: MockNotification[];
  dlq: { queueSize: number; messages: unknown[] };
};

function uid() {
  return crypto.randomUUID();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedDb(): MockDb {
  const adminId = uid();
  const clienteId = uid();
  const operadorId = uid();

  const users: MockUser[] = [
    {
      id: adminId,
      email: 'admin@demo.com',
      password: 'admin123',
      role: 'admin',
      phone: '+573001234567',
      totp_enabled: true,
      totp_secret: 'MOCKSECRET',
      backup_codes: ['demo0001', 'demo0002', 'demo0003'],
      created_at: daysAgo(90),
    },
    {
      id: clienteId,
      email: 'cliente@demo.com',
      password: 'cliente123',
      role: 'cliente',
      phone: '+573009876543',
      totp_enabled: false,
      totp_secret: null,
      backup_codes: [],
      created_at: daysAgo(60),
    },
    {
      id: operadorId,
      email: 'operador@demo.com',
      password: 'operador123',
      role: 'operador',
      phone: null,
      totp_enabled: false,
      totp_secret: null,
      backup_codes: [],
      created_at: daysAgo(45),
    },
  ];

  const orders: MockOrder[] = [
    {
      id: uid(),
      user_id: clienteId,
      items: [{ name: 'Auriculares Pro', qty: 1, price: 89.99 }],
      total: '89.99',
      status: 'delivered',
      created_at: daysAgo(12),
      updated_at: daysAgo(5),
      user_email: 'cliente@demo.com',
      user_phone: '+573009876543',
    },
    {
      id: uid(),
      user_id: clienteId,
      items: [{ name: 'Monitor 27"', qty: 1, price: 320 }, { name: 'Cable HDMI', qty: 2, price: 15 }],
      total: '350.00',
      status: 'shipped',
      created_at: daysAgo(7),
      updated_at: daysAgo(2),
      user_email: 'cliente@demo.com',
      user_phone: '+573009876543',
    },
    {
      id: uid(),
      user_id: clienteId,
      items: [{ name: 'Laptop Ultra', qty: 1, price: 1299 }],
      total: '1299.00',
      status: 'paid',
      created_at: daysAgo(3),
      updated_at: daysAgo(1),
      user_email: 'cliente@demo.com',
      user_phone: '+573009876543',
    },
    {
      id: uid(),
      user_id: clienteId,
      items: [{ name: 'Teclado mecánico', qty: 1, price: 120 }],
      total: '120.00',
      status: 'pending',
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
      user_email: 'cliente@demo.com',
      user_phone: '+573009876543',
    },
    {
      id: uid(),
      user_id: clienteId,
      items: [{ name: 'Silla ergonómica', qty: 1, price: 450 }],
      total: '450.00',
      status: 'returned',
      created_at: daysAgo(20),
      updated_at: daysAgo(15),
      user_email: 'cliente@demo.com',
      user_phone: '+573009876543',
    },
  ];

  const notifications: MockNotification[] = [
    { id: uid(), order_id: orders[0].id, type: 'email', status: 'sent', recipient: 'cliente@demo.com', template: 'order_created', error_message: null, created_at: daysAgo(12) },
    { id: uid(), order_id: orders[2].id, type: 'email', status: 'sent', recipient: 'cliente@demo.com', template: 'order_created', error_message: null, created_at: daysAgo(3) },
    { id: uid(), order_id: orders[2].id, type: 'sms', status: 'sent', recipient: '+573009876543', template: 'high_value_order', error_message: null, created_at: daysAgo(3) },
    { id: uid(), order_id: orders[1].id, type: 'email', status: 'sent', recipient: 'cliente@demo.com', template: 'order_shipped', error_message: null, created_at: daysAgo(2) },
    { id: uid(), order_id: orders[4].id, type: 'email', status: 'failed', recipient: 'cliente@demo.com', template: 'order_returned', error_message: 'SMTP timeout', created_at: daysAgo(15) },
    { id: uid(), order_id: null, type: 'sms', status: 'failed', recipient: '+573000000000', template: 'test', error_message: 'Invalid number', created_at: daysAgo(8) },
  ];

  return {
    users,
    orders,
    notifications,
    dlq: {
      queueSize: 2,
      messages: [
        { content: { orderId: orders[4].id, type: 'order_returned' }, properties: {}, fields: {} },
        { content: { orderId: orders[2].id, type: 'high_value_order' }, properties: {}, fields: {} },
      ],
    },
  };
}

export function loadDb(): MockDb {
  if (typeof window === 'undefined') return seedDb();
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = seedDb();
      localStorage.setItem(DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as MockDb;
  } catch {
    const seeded = seedDb();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function saveDb(db: MockDb) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetMockDb() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DB_KEY);
  loadDb();
}

export { uid, daysAgo };
