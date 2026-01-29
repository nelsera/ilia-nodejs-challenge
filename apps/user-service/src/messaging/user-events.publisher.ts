import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { InternalTokenService } from '../auth/internal/internal-token.service';

export type UserCreatedEvent = {
  event: 'user.created';
  userId: string;
  email: string;
  internalToken: string;
  occurredAt: string;
};

@Injectable()
export class UserEventsPublisher {
  constructor(
    @Inject('RABBIT_CLIENT') private readonly client: ClientProxy,
    private readonly internalTokenService: InternalTokenService,
  ) {}

  async userCreated(payload: { userId: string; email: string }) {
    const internalToken = this.internalTokenService.signUsersServiceToken();

    const event: UserCreatedEvent = {
      event: 'user.created',
      occurredAt: new Date().toISOString(),
      internalToken,
      ...payload,
    };

    await firstValueFrom(this.client.emit('user.created', event));
  }
}
