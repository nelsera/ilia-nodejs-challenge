import request, { type Response } from 'supertest';

type WalletBalance = {
  walletId: string;
  userId: string;
  balance: number;
  credits: number;
  debits: number;
};

const USERS_BASE_URL = process.env.USERS_BASE_URL ?? 'http://localhost:3001';
const WALLET_BASE_URL = process.env.WALLET_BASE_URL ?? 'http://localhost:3002';

const makeUniqueEmail = (prefix: string) =>
  `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@test.com`;

const expectStatus200or201 = (response: Response) => {
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      `Expected 200 or 201, got ${response.status}. Body=${JSON.stringify(response.body)}`,
    );
  }
};

const extractJwtTokenFromBody = (body: unknown): string | undefined => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const responseBody = body as Record<string, unknown>;

  const directToken = responseBody.accessToken;

  if (typeof directToken === 'string' && directToken.length > 10) {
    return directToken;
  }

  const dataField = responseBody.data;

  if (dataField && typeof dataField === 'object') {
    const nested = dataField as Record<string, unknown>;

    const nestedToken = nested.token ?? nested.accessToken;

    if (typeof nestedToken === 'string' && nestedToken.length > 10) {
      return nestedToken;
    }
  }

  return undefined;
};

async function signupAndLogin(): Promise<{ token: string; email: string }> {
  const email = makeUniqueEmail('wallet-e2e');

  const password = '123456';

  await request(USERS_BASE_URL)
    .post('/auth/signup')
    .send({ email, password })
    .expect(expectStatus200or201);

  const loginResponse = await request(USERS_BASE_URL)
    .post('/auth/login')
    .send({ email, password })
    .expect(expectStatus200or201);

  const token = extractJwtTokenFromBody(loginResponse.body);

  if (!token) {
    throw new Error(
      `Login did not return a token. Status=${loginResponse.status}. Body=${JSON.stringify(
        loginResponse.body,
      )}`,
    );
  }

  return { token, email };
}

describe('Wallet Service (e2e) - main flow', () => {
  it('should deny requests without token (401)', async () => {
    await request(WALLET_BASE_URL).get('/wallets/me/balance').expect(401);
  });

  it('full flow: create/get, credit, balance, debit, insufficient balance', async () => {
    const { token } = await signupAndLogin();

    // 1) Create or get my wallet
    const walletCreateOrGetResponse = await request(WALLET_BASE_URL)
      .post('/wallets/me')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(expectStatus200or201);

    expect(walletCreateOrGetResponse.body).toBeTruthy();

    // 2) Credit +1000
    await request(WALLET_BASE_URL)
      .post('/wallets/me/credit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000, description: 'test credit' })
      .expect(expectStatus200or201);

    // 3) Balance should be 1000
    const firstBalanceResponse = await request(WALLET_BASE_URL)
      .get('/wallets/me/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const firstBalance = firstBalanceResponse.body as WalletBalance;

    expect(firstBalance.balance).toBe(1000);
    expect(firstBalance.credits).toBe(1000);
    expect(firstBalance.debits).toBe(0);

    // 4) Debit -400 (userId comes from JWT subject)
    await request(WALLET_BASE_URL)
      .post('/wallets/me/debit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 400, description: 'test debit' })
      .expect(expectStatus200or201);

    // 5) Balance should be 600
    const secondBalanceResponse = await request(WALLET_BASE_URL)
      .get('/wallets/me/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const secondBalance = secondBalanceResponse.body as WalletBalance;

    expect(secondBalance.balance).toBe(600);
    expect(secondBalance.credits).toBe(1000);
    expect(secondBalance.debits).toBe(400);

    // 6) Debit above balance must fail (400)
    await request(WALLET_BASE_URL)
      .post('/wallets/me/debit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 999999, description: 'should fail' })
      .expect(400);
  });
});
