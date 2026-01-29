import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserEventsPublisher } from '../messaging/user-events.publisher';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userEvents: UserEventsPublisher,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(email: string, passwordHash: string) {
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    await this.userEvents.userCreated({
      userId: user.id,
      email: user.email,
    });

    return user;
  }
}
