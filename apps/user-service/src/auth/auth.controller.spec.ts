import { Test } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('signup: should call auth.signup and return result', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    authService.signup.mockResolvedValue({
      user: { id: 'u1', email: 'nelson@test.com', createdAt },
      accessToken: 'jwt-token',
    });

    const dto = new SignupDto();

    dto.email = 'nelson@test.com';
    dto.password = '123456';

    const res = await controller.signup(dto);

    expect(authService.signup).toHaveBeenCalledWith('nelson@test.com', '123456');
    expect(res).toEqual({
      user: { id: 'u1', email: 'nelson@test.com', createdAt },
      accessToken: 'jwt-token',
    });
  });

  it('login: should call auth.login and return result', async () => {
    authService.login.mockResolvedValue({ accessToken: 'jwt-token' });

    const dto = new LoginDto();

    dto.email = 'nelson@test.com';
    dto.password = '123456';

    const res = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith('nelson@test.com', '123456');
    expect(res).toEqual({ accessToken: 'jwt-token' });
  });
});
