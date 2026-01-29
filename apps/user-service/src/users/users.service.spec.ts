import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserEventsPublisher } from '../messaging/user-events.publisher';

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

type UserEventsPublisherMock = {
  userCreated: jest.Mock<Promise<void>, [{ userId: string; email: string }]>;
};

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const userEventsMock: UserEventsPublisherMock = {
    userCreated: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UserEventsPublisher, useValue: userEventsMock },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByEmail: should call prisma.user.findUnique', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

    const res = await service.findByEmail('a@b.com');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
    expect(res).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('createUser: should call prisma.user.create and publish user.created event', async () => {
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

    const res = await service.createUser('a@b.com', 'hash');

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'a@b.com', passwordHash: 'hash' },
    });

    expect(userEventsMock.userCreated).toHaveBeenCalledWith({
      userId: 'u1',
      email: 'a@b.com',
    });

    expect(res).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('createUser: should throw if publisher fails', async () => {
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

    userEventsMock.userCreated.mockRejectedValueOnce(new Error('publish failed'));

    await expect(service.createUser('a@b.com', 'hash')).rejects.toThrow('publish failed');

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(userEventsMock.userCreated).toHaveBeenCalledTimes(1);
  });
});
