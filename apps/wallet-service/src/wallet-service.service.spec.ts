import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { WalletService } from './wallet-service.service';
import { PrismaService } from './prisma/prisma.service';

type Wallet = {
  id: string;
  userId: string;
};

type WalletBalance = {
  walletId: string;
  userId: string;
  balance: number;
  credits: number;
  debits: number;
};

describe('WalletService', () => {
  let service: WalletService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaMock: jest.Mocked<PrismaService> = {
      wallet: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      walletTransaction: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const moduleRef = await Test.createTestingModule({
      providers: [WalletService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(WalletService);
    prisma = moduleRef.get(PrismaService);
  });

  describe('getOrCreateWallet', () => {
    it('should upsert wallet by userId', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      prisma.wallet.upsert.mockResolvedValue(wallet);

      const result = await service.getOrCreateWallet('user-1');

      expect(prisma.wallet.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {},
        create: { userId: 'user-1' },
        include: { transactions: false },
      });

      expect(result).toEqual(wallet);
    });
  });

  describe('getWalletByUserId', () => {
    it('should return wallet', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      prisma.wallet.findUnique.mockResolvedValue(wallet);

      const result = await service.getWalletByUserId('user-1');

      expect(result).toEqual(wallet);
    });
  });

  describe('getBalance', () => {
    it('should calculate balance correctly', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(wallet);

      prisma.walletTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000 } })
        .mockResolvedValueOnce({ _sum: { amount: 300 } });

      const result = await service.getBalance('user-1');

      expect(result).toEqual<WalletBalance>({
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 700,
        credits: 1000,
        debits: 300,
      });
    });

    it('should treat null sums as zero', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(wallet);

      prisma.walletTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service.getBalance('user-1');

      expect(result.balance).toBe(0);
      expect(result.credits).toBe(0);
      expect(result.debits).toBe(0);
    });
  });

  describe('credit', () => {
    it('should create credit transaction and return balance', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(wallet);

      prisma.walletTransaction.create.mockResolvedValue({
        id: 'tx-1',
        walletId: 'wallet-1',
        type: 'CREDIT',
        amount: 500,
        description: 'Bonus',
        createdAt: new Date(),
      });

      jest.spyOn(service, 'getBalance').mockResolvedValue({
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 500,
        credits: 500,
        debits: 0,
      });

      const result = await service.credit('user-1', 500, 'Bonus');

      expect(result.balance).toBe(500);
      expect(result.credits).toBe(500);
    });
  });

  describe('debit', () => {
    it('should throw if balance is insufficient', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(wallet);
      jest.spyOn(service, 'getBalance').mockResolvedValue({
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 100,
        credits: 100,
        debits: 0,
      });

      await expect(service.debit('user-1', 200)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should debit and return new balance', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(wallet);

      jest
        .spyOn(service, 'getBalance')
        .mockResolvedValueOnce({
          walletId: 'wallet-1',
          userId: 'user-1',
          balance: 1000,
          credits: 1000,
          debits: 0,
        })
        .mockResolvedValueOnce({
          walletId: 'wallet-1',
          userId: 'user-1',
          balance: 700,
          credits: 1000,
          debits: 300,
        });

      prisma.walletTransaction.create.mockResolvedValue({
        id: 'tx-2',
        walletId: 'wallet-1',
        type: 'DEBIT',
        amount: 300,
        description: 'Purchase',
        createdAt: new Date(),
      });

      const result = await service.debit('user-1', 300, 'Purchase');

      expect(result.balance).toBe(700);
      expect(result.debits).toBe(300);
    });
  });

  describe('listTransactions', () => {
    it('should return paginated transactions', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };

      jest.spyOn(service, 'getOrCreateWallet').mockResolvedValue(wallet);

      prisma.walletTransaction.findMany.mockResolvedValue([{ id: 'tx-1' }, { id: 'tx-2' }]);

      prisma.walletTransaction.count.mockResolvedValue(2);

      const result = await service.listTransactions('user-1');

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });
  });
});
