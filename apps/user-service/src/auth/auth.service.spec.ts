import { Test } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('signup: should create user and return token', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '10m';
      return undefined;
    });

    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'u1',
      email: 'nelson@test.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      passwordHash: 'hash',
    });
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const res = await service.signup('nelson@test.com', '123456');

    expect(usersService.findByEmail).toHaveBeenCalledWith('nelson@test.com');
    expect(usersService.createUser).toHaveBeenCalledWith('nelson@test.com', expect.any(String));

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 'u1', email: 'nelson@test.com' },
      expect.objectContaining({
        secret: 'test-secret',
        expiresIn: '10m',
      }),
    );

    expect(res).toEqual({
      user: {
        id: 'u1',
        email: 'nelson@test.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      accessToken: 'jwt-token',
    });
  });

  it('signup: should throw if email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'u1' });

    await expect(service.signup('nelson@test.com', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('login: should return token when credentials are valid', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'nelson@test.com',
      passwordHash: await bcrypt.hash('123456', 10),
    });
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const res = await service.login('nelson@test.com', '123456');

    expect(res).toEqual({ accessToken: 'jwt-token' });
  });

  it('login: should throw when user not found', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.login('x@test.com', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login: should throw when password is invalid', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'nelson@test.com',
      passwordHash: await bcrypt.hash('other', 10),
    });

    await expect(service.login('nelson@test.com', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
