import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { InternalTokenService } from './internal-token.service';

describe('InternalTokenService', () => {
  let service: InternalTokenService;

  const jwtMock = {
    sign: jest.fn(),
  };

  const configMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalTokenService,
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get(InternalTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sign an internal users-service token', () => {
    configMock.get.mockReturnValue('internal-secret');
    jwtMock.sign.mockReturnValue('signed-token');

    const token = service.signUsersServiceToken();

    expect(configMock.get).toHaveBeenCalledWith('JWT_INTERNAL_SECRET');

    expect(jwtMock.sign).toHaveBeenCalledWith(
      { scope: 'internal' },
      {
        secret: 'internal-secret',
        subject: 'users-service',
        expiresIn: '5m',
      },
    );

    expect(token).toBe('signed-token');
  });

  it('should throw if JWT_INTERNAL_SECRET is missing', () => {
    configMock.get.mockReturnValue(undefined);

    expect(() => service.signUsersServiceToken()).toThrow('JWT_INTERNAL_SECRET is missing');

    expect(jwtMock.sign).not.toHaveBeenCalled();
  });
});
