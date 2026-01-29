import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WalletController } from './wallet-service.controller';
import { WalletService } from './wallet-service.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletEventsController } from './messaging/wallet-events.controller';
import { InternalWalletController } from './internal/internal-wallet.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [WalletController, WalletEventsController, InternalWalletController],
  providers: [WalletService],
})
export class WalletModule {}
