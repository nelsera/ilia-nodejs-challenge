import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
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

  it('createUser: should call prisma.user.create', async () => {
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

    const res = await service.createUser('a@b.com', 'hash');

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'a@b.com', passwordHash: 'hash' },
    });
    expect(res).toEqual({ id: 'u1', email: 'a@b.com' });
  });
});
