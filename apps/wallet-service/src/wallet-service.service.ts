import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

type TxType = 'CREDIT' | 'DEBIT';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { transactions: false },
    });
  }

  async getWalletByUserId(userId: string) {
    return this.prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const [credits, debits] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: 'CREDIT' as TxType },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: 'DEBIT' as TxType },
        _sum: { amount: true },
      }),
    ]);

    const creditSum = credits._sum.amount ?? 0;
    const debitSum = debits._sum.amount ?? 0;

    return {
      walletId: wallet.id,
      userId: wallet.userId,
      balance: creditSum - debitSum,
      credits: creditSum,
      debits: debitSum,
    };
  }

  async credit(userId: string, amount: number, description?: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const tx = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        description,
      },
    });

    const balance = await this.getBalance(userId);
    return { transaction: tx, ...balance };
  }

  async debit(userId: string, amount: number, description?: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const balance = await this.getBalance(userId);

    if (balance.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const tx = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        description,
      },
    });

    const newBalance = await this.getBalance(userId);
    return { transaction: tx, ...newBalance };
  }

  async listTransactions(userId: string, skip = 0, take = 20) {
    const wallet = await this.getOrCreateWallet(userId);

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      walletId: wallet.id,
      userId: wallet.userId,
      total,
      skip,
      take,
      items,
    };
  }
}
