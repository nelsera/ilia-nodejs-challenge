import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

type AccessTokenPayload = {
  sub: string;
  email: string;
};

type SignupResult = {
  user: { id: string; email: string; createdAt: Date };
  accessToken: string;
};

type LoginResult = {
  accessToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;

    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private async signToken(payload: AccessTokenPayload): Promise<string> {
    const secret = this.config.get<string>('JWT_SECRET')!;

    const expiresInFromEnv = this.config.get<string>('JWT_EXPIRES_IN');

    const expiresIn: number | StringValue = expiresInFromEnv
      ? (expiresInFromEnv as StringValue)
      : ('1h' as StringValue);

    return this.jwt.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async signup(email: string, password: string): Promise<SignupResult> {
    const exists = await this.usersService.findByEmail(email);

    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await this.usersService.createUser(email, passwordHash);

    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
    });

    return {
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      accessToken,
    };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.comparePassword(password, user.passwordHash);

    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }
}
