import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './external/jwt.strategy';
import { InternalJwtStrategy } from './internal/internal-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: () => {
        return {};
      },
    }),
  ],
  providers: [JwtStrategy, InternalJwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
