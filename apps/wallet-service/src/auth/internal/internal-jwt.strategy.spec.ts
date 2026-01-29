import { ConfigService } from '@nestjs/config';

import { InternalJwtStrategy, type InternalJwtPayload } from './internal-jwt.strategy';

type ConfigServiceMock = {
  get: jest.Mock;
};

describe('InternalJwtStrategy', () => {
  const makeConfig = (secret?: string): ConfigService => {
    const configMock: ConfigServiceMock = {
      get: jest.fn().mockReturnValue(secret),
    };

    return configMock as unknown as ConfigService;
  };

  it('should throw if JWT_INTERNAL_SECRET is missing', () => {
    const config = makeConfig(undefined);

    expect(() => new InternalJwtStrategy(config)).toThrow('JWT_INTERNAL_SECRET is missing');
  });

  it('should create strategy when JWT_INTERNAL_SECRET is provided', () => {
    const config = makeConfig('internal-secret');

    expect(() => new InternalJwtStrategy(config)).not.toThrow();
  });

  it('validate should return the payload', async () => {
    const config = makeConfig('internal-secret');
    const strategy = new InternalJwtStrategy(config);

    const payload: InternalJwtPayload = {
      sub: 'users-service',
      scope: 'internal',
      iat: 1,
      exp: 2,
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual(payload);
  });
});
