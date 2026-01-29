import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const makeConfig = (secret?: string): ConfigService => {
    const config = {
      get: <T = string>(): T | undefined => secret as unknown as T | undefined,
    };

    return config as unknown as ConfigService;
  };

  it('should throw if JWT_SECRET is missing', () => {
    const config = makeConfig(undefined);

    expect(() => new JwtStrategy(config)).toThrow('JWT_SECRET is missing');
  });

  it('should create strategy when JWT_SECRET is provided', () => {
    const config = makeConfig('super-secret');

    expect(() => new JwtStrategy(config)).not.toThrow();
  });

  it('validate should return the payload', async () => {
    const config = makeConfig('super-secret');
    const strategy = new JwtStrategy(config);

    const payload = {
      sub: 'user-1',
      email: 'user@email.com',
      roles: ['user'],
      iat: 1,
      exp: 2,
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual(payload);
  });
});
