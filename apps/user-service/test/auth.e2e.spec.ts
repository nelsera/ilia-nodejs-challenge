import request from 'supertest';

const USERS_BASE_URL = process.env.USERS_BASE_URL! ?? 'http://localhost:3001';

const makeEmail = (prefix: string) =>
  `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@test.com`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getTokenFromBody(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const direct = pickString(body.accessToken);

  if (direct) {
    return direct;
  }

  const data = body.data;
  if (isRecord(data)) {
    return pickString(data.accessToken);
  }

  return undefined;
}

describe('User Service (e2e) - Auth', () => {
  it('POST /auth/signup should create user (proved by successful login)', async () => {
    const email = makeEmail('signup');

    const password = '123456';

    await request(USERS_BASE_URL).post('/auth/signup').send({ email, password }).expect(201);

    const loginRes = await request(USERS_BASE_URL)
      .post('/auth/login')
      .send({ email, password })
      .expect((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error(`Expected 200 or 201, got ${res.status}`);
        }
      });

    const token = getTokenFromBody(loginRes.body);

    expect(typeof token).toBe('string');
    expect((token ?? '').length).toBeGreaterThan(10);
  });

  it('POST /auth/signup should fail with 400 for invalid email', async () => {
    await request(USERS_BASE_URL)
      .post('/auth/signup')
      .send({ email: 'invalid-email', password: '123456' })
      .expect(400);
  });

  it('POST /auth/signup should fail with 400 for duplicate email', async () => {
    const email = makeEmail('dup');
    const password = '123456';

    await request(USERS_BASE_URL).post('/auth/signup').send({ email, password }).expect(201);

    await request(USERS_BASE_URL).post('/auth/signup').send({ email, password }).expect(400);
  });

  it('POST /auth/login should return token for valid credentials', async () => {
    const email = makeEmail('login');
    const password = '123456';

    await request(USERS_BASE_URL).post('/auth/signup').send({ email, password }).expect(201);

    const res = await request(USERS_BASE_URL)
      .post('/auth/login')
      .send({ email, password })
      .expect((r) => {
        if (r.status !== 200 && r.status !== 201) {
          throw new Error(`Expected 200 or 201, got ${r.status}`);
        }
      });

    const token = getTokenFromBody(res.body);

    expect(typeof token).toBe('string');

    expect((token ?? '').length).toBeGreaterThan(10);
  });

  it('POST /auth/login should return 401 for invalid credentials', async () => {
    await request(USERS_BASE_URL)
      .post('/auth/login')
      .send({ email: makeEmail('nope'), password: 'wrong' })
      .expect(401);
  });
});
