import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { WalletService } from '../wallet-service.service';

type UserCreatedEvent = {
  event: 'user.created';
  userId: string;
  email: string;
  internalToken: string;
  occurredAt: string;
};

@Controller()
export class WalletEventsController {
  private readonly logger = new Logger(WalletEventsController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @EventPattern('user.created')
  async handleUserCreated(@Payload() msg: UserCreatedEvent, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef();
    const originalMsg = ctx.getMessage();

    try {
      const secret = this.configService.get<string>('JWT_INTERNAL_SECRET');

      if (!secret) {
        throw new Error('JWT_INTERNAL_SECRET is not configured');
      }

      this.jwtService.verify(msg.internalToken, {
        secret,
      });

      await this.walletService.getOrCreateWallet(msg.userId);

      channel.ack(originalMsg);
    } catch (err) {
      this.logger.error(`Failed to process user.created for userId=${msg.userId}`, err as Error);

      channel.nack(originalMsg, false, true);
    }
  }
}
