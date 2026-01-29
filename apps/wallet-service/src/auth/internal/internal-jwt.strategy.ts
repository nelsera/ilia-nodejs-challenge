import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type InternalJwtPayload = {
  sub: string;
  scope?: 'internal';
  iat?: number;
  exp?: number;
};

@Injectable()
export class InternalJwtStrategy extends PassportStrategy(Strategy, 'internal-jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_INTERNAL_SECRET');

    if (!secret) {
      throw new Error('JWT_INTERNAL_SECRET is missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: InternalJwtPayload) {
    return payload;
  }
}
