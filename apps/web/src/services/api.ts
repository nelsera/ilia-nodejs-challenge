const USERS_BASE_URL = import.meta.env.VITE_USERS_BASE_URL as string;
const WALLET_BASE_URL = import.meta.env.VITE_WALLET_BASE_URL as string;

const TOKEN_KEY = 'ilia.jwt.token';

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  if (!token) {
    throw new Error('Invalid token received from API');
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiErrorShape = {
  message?: string | string[];
};

async function request<T>(
  baseUrl: string,
  path: string,
  options?: {
    method?: HttpMethod;
    body?: unknown;
    auth?: boolean;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const method = options?.method ?? 'GET';

  const auth = options?.auth ?? true;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');

    let message = text || `Request failed (${res.status})`;

    const json = JSON.parse(text) as ApiErrorShape;

    if (json?.message) {
      message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
    }

    throw new Error(message);
  }

  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return {} as T;
  }

  return (await res.json()) as T;
}

type AuthResponse = { accessToken: string };

export const usersApi = {
  signup: (email: string, password: string) =>
    request<AuthResponse>(USERS_BASE_URL, '/auth/signup', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>(USERS_BASE_URL, '/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
};

export type WalletBalance = { balance: number };

export type WalletTransaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  createdAt: string;
};

export type WalletTransactionsResponse = {
  items: WalletTransaction[];
  total: number;
  skip: number;
  take: number;
  userId: string;
  walletId: string;
};

export type Wallet = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export const walletApi = {
  createOrGetMe: () => request<Wallet>(WALLET_BASE_URL, '/wallets/me', { method: 'POST' }),

  getMe: () => request<Wallet>(WALLET_BASE_URL, '/wallets/me'),

  credit: (amount: number) =>
    request<void>(WALLET_BASE_URL, '/wallets/me/credit', {
      method: 'POST',
      body: { amount },
    }),

  debit: (amount: number) =>
    request<void>(WALLET_BASE_URL, '/wallets/me/debit', {
      method: 'POST',
      body: { amount },
    }),

  balance: () => request<WalletBalance>(WALLET_BASE_URL, '/wallets/me/balance'),

  transactions: () =>
    request<WalletTransactionsResponse>(WALLET_BASE_URL, '/wallets/me/transactions'),
};
