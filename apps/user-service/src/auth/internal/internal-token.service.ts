import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class InternalTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signUsersServiceToken(): string {
    const secret = this.config.get<string>('JWT_INTERNAL_SECRET');

    if (!secret) {
      throw new Error('JWT_INTERNAL_SECRET is missing');
    }

    return this.jwt.sign(
      { scope: 'internal' },
      {
        secret,
        subject: 'users-service',
        expiresIn: '5m',
      },
    );
  }
}
