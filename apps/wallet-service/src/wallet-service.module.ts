import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WalletController } from './wallet-service.controller';
import { WalletService } from './wallet-service.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
