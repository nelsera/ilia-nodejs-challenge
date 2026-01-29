import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { RmqContext } from '@nestjs/microservices';

import { WalletEventsController } from './wallet-events.controller';
import { WalletService } from '../wallet-service.service';

jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

type ChannelRef = {
  ack: jest.Mock<void, [unknown]>;
  nack: jest.Mock<void, [unknown, boolean, boolean]>;
};

type RmqContextMock = {
  getChannelRef: () => ChannelRef;
  getMessage: () => unknown;
};

describe('WalletEventsController', () => {
  let controller: WalletEventsController;

  const walletServiceMock = {
    getOrCreateWallet: jest.fn(),
  };

  const jwtServiceMock = {
    verify: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const makeCtx = (): { ctx: RmqContext; channel: ChannelRef; originalMsg: unknown } => {
    const channel: ChannelRef = {
      ack: jest.fn(),
      nack: jest.fn(),
    };

    const originalMsg = { fields: { deliveryTag: 1 } };

    const ctxMock: RmqContextMock = {
      getChannelRef: () => channel,
      getMessage: () => originalMsg,
    };

    return {
      ctx: ctxMock as unknown as RmqContext,
      channel,
      originalMsg,
    };
  };

  const baseEvent = {
    event: 'user.created' as const,
    userId: 'u1',
    email: 'a@b.com',
    internalToken: 'internal.jwt.token',
    occurredAt: '2026-01-29T22:00:00.000Z',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletEventsController],
      providers: [
        { provide: WalletService, useValue: walletServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    controller = module.get(WalletEventsController);
  });

  it('should ack when token is valid and wallet is created', async () => {
    const { ctx, channel, originalMsg } = makeCtx();

    configServiceMock.get.mockReturnValue('internal-secret');

    jwtServiceMock.verify.mockReturnValue({ sub: 'users-service', scope: 'internal' });

    walletServiceMock.getOrCreateWallet.mockResolvedValue({ id: 'w1', userId: 'u1' });

    await controller.handleUserCreated(baseEvent, ctx);

    expect(configServiceMock.get).toHaveBeenCalledWith('JWT_INTERNAL_SECRET');
    expect(jwtServiceMock.verify).toHaveBeenCalledWith('internal.jwt.token', {
      secret: 'internal-secret',
    });
    expect(walletServiceMock.getOrCreateWallet).toHaveBeenCalledWith('u1');

    expect(channel.ack).toHaveBeenCalledWith(originalMsg);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('should nack (requeue) when JWT_INTERNAL_SECRET is missing', async () => {
    const { ctx, channel, originalMsg } = makeCtx();

    configServiceMock.get.mockReturnValue(undefined);

    await controller.handleUserCreated(baseEvent, ctx);

    expect(jwtServiceMock.verify).not.toHaveBeenCalled();
    expect(walletServiceMock.getOrCreateWallet).not.toHaveBeenCalled();

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(originalMsg, false, true);
  });

  it('should nack (requeue) when jwt verification fails', async () => {
    const { ctx, channel, originalMsg } = makeCtx();

    configServiceMock.get.mockReturnValue('internal-secret');

    jwtServiceMock.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await controller.handleUserCreated(baseEvent, ctx);

    expect(walletServiceMock.getOrCreateWallet).not.toHaveBeenCalled();

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(originalMsg, false, true);
  });

  it('should nack (requeue) when wallet service fails', async () => {
    const { ctx, channel, originalMsg } = makeCtx();

    configServiceMock.get.mockReturnValue('internal-secret');

    jwtServiceMock.verify.mockReturnValue({ sub: 'users-service', scope: 'internal' });

    walletServiceMock.getOrCreateWallet.mockRejectedValue(new Error('db error'));

    await controller.handleUserCreated(baseEvent, ctx);

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(originalMsg, false, true);
  });
});
