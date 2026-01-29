import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEventsPublisher } from './user-events.publisher';
import { InternalAuthModule } from '../auth/internal/internal-auth.module';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'RABBIT_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: config.getOrThrow<string>('EVENTS_RABBITMQ_QUEUE'),
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
    InternalAuthModule,
  ],
  providers: [UserEventsPublisher],
  exports: [UserEventsPublisher],
})
export class MessagingModule {}
