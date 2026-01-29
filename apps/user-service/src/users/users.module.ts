import { Module } from '@nestjs/common';

import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [PrismaModule, MessagingModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
