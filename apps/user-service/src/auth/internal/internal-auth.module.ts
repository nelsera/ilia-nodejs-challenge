import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { InternalTokenService } from './internal-token.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [InternalTokenService],
  exports: [InternalTokenService],
})
export class InternalAuthModule {}
