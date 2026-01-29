import { Test } from '@nestjs/testing';

import { WalletController } from './wallet-service.controller';
import { WalletService } from './wallet-service.service';
import { type CurrentUserPayload } from './auth/current-user.decorator';
import { type CreditWalletDto } from './dto/credit-wallet.dto';
import { type DebitWalletDto } from './dto/debit-wallet.dto';

type Wallet = { id: string; userId: string };

type WalletBalance = {
  walletId: string;
  userId: string;
  balance: number;
  credits: number;
  debits: number;
};

type TxList = {
  walletId: string;
  userId: string;
  total: number;
  skip: number;
  take: number;
  items: Array<{ id: string }>;
};

describe('WalletController', () => {
  let controller: WalletController;

  const walletServiceMock = {
    getOrCreateWallet: jest.fn(),
    credit: jest.fn(),
    debit: jest.fn(),
    getWalletByUserId: jest.fn(),
    getBalance: jest.fn(),
    listTransactions: jest.fn(),
  };

  const user: CurrentUserPayload = {
    sub: 'user-1',
    email: 'user1@email.com',
    roles: ['user'],
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: walletServiceMock }],
    }).compile();

    controller = moduleRef.get(WalletController);
  });

  describe('createOrGet', () => {
    it('should call getOrCreateWallet with user.sub', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };
      walletServiceMock.getOrCreateWallet.mockResolvedValueOnce(wallet);

      const result = await controller.createOrGet(user);

      expect(walletServiceMock.getOrCreateWallet).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(wallet);
    });
  });

  describe('credit', () => {
    it('should call credit with user.sub and dto', async () => {
      const dto: CreditWalletDto = { amount: 500, description: 'Bonus' };

      const response = {
        transaction: { id: 'tx-1' },
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 500,
        credits: 500,
        debits: 0,
      };

      walletServiceMock.credit.mockResolvedValueOnce(response);

      const result = await controller.credit(user, dto);

      expect(walletServiceMock.credit).toHaveBeenCalledWith('user-1', 500, 'Bonus');
      expect(result).toEqual(response);
    });

    it('should pass undefined description when not provided', async () => {
      const dto: CreditWalletDto = { amount: 1000 };

      const response: WalletBalance = {
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 1000,
        credits: 1000,
        debits: 0,
      };

      walletServiceMock.credit.mockResolvedValueOnce(response);

      const result = await controller.credit(user, dto);

      expect(walletServiceMock.credit).toHaveBeenCalledWith('user-1', 1000, undefined);
      expect(result).toEqual(response);
    });
  });

  describe('debit', () => {
    it('should call debit with user.sub and dto', async () => {
      const dto: DebitWalletDto = { amount: 300, description: 'Purchase' };

      const response = {
        transaction: { id: 'tx-2' },
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 700,
        credits: 1000,
        debits: 300,
      };

      walletServiceMock.debit.mockResolvedValueOnce(response);

      const result = await controller.debit(user, dto);

      expect(walletServiceMock.debit).toHaveBeenCalledWith('user-1', 300, 'Purchase');
      expect(result).toEqual(response);
    });

    it('should pass undefined description when not provided', async () => {
      const dto: DebitWalletDto = { amount: 100 };

      const response: WalletBalance = {
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 900,
        credits: 1000,
        debits: 100,
      };

      walletServiceMock.debit.mockResolvedValueOnce(response);

      const result = await controller.debit(user, dto);

      expect(walletServiceMock.debit).toHaveBeenCalledWith('user-1', 100, undefined);
      expect(result).toEqual(response);
    });
  });

  describe('getWallet', () => {
    it('should call getWalletByUserId with user.sub', async () => {
      const wallet: Wallet = { id: 'wallet-1', userId: 'user-1' };
      walletServiceMock.getWalletByUserId.mockResolvedValueOnce(wallet);

      const result = await controller.getWallet(user);

      expect(walletServiceMock.getWalletByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(wallet);
    });
  });

  describe('getBalance', () => {
    it('should call getBalance with user.sub', async () => {
      const balance: WalletBalance = {
        walletId: 'wallet-1',
        userId: 'user-1',
        balance: 700,
        credits: 1000,
        debits: 300,
      };

      walletServiceMock.getBalance.mockResolvedValueOnce(balance);

      const result = await controller.getBalance(user);

      expect(walletServiceMock.getBalance).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(balance);
    });
  });

  describe('listTransactions', () => {
    it('should call listTransactions with defaults when skip/take are undefined', async () => {
      const response: TxList = {
        walletId: 'wallet-1',
        userId: 'user-1',
        total: 2,
        skip: 0,
        take: 20,
        items: [{ id: 'tx-1' }, { id: 'tx-2' }],
      };

      walletServiceMock.listTransactions.mockResolvedValueOnce(response);

      const result = await controller.listTransactions(user, undefined, undefined);

      expect(walletServiceMock.listTransactions).toHaveBeenCalledWith('user-1', 0, 20);
      expect(result).toEqual(response);
    });

    it('should call listTransactions with provided skip/take', async () => {
      const response: TxList = {
        walletId: 'wallet-1',
        userId: 'user-1',
        total: 10,
        skip: 5,
        take: 3,
        items: [{ id: 'tx-3' }],
      };

      walletServiceMock.listTransactions.mockResolvedValueOnce(response);

      const result = await controller.listTransactions(user, 5, 3);

      expect(walletServiceMock.listTransactions).toHaveBeenCalledWith('user-1', 5, 3);
      expect(result).toEqual(response);
    });

    it('should default take to 20 when skip is provided but take is undefined', async () => {
      const response: TxList = {
        walletId: 'wallet-1',
        userId: 'user-1',
        total: 10,
        skip: 7,
        take: 20,
        items: [{ id: 'tx-4' }],
      };

      walletServiceMock.listTransactions.mockResolvedValueOnce(response);

      const result = await controller.listTransactions(user, 7, undefined);

      expect(walletServiceMock.listTransactions).toHaveBeenCalledWith('user-1', 7, 20);
      expect(result).toEqual(response);
    });

    it('should default skip to 0 when take is provided but skip is undefined', async () => {
      const response: TxList = {
        walletId: 'wallet-1',
        userId: 'user-1',
        total: 10,
        skip: 0,
        take: 1,
        items: [{ id: 'tx-5' }],
      };

      walletServiceMock.listTransactions.mockResolvedValueOnce(response);

      const result = await controller.listTransactions(user, undefined, 1);

      expect(walletServiceMock.listTransactions).toHaveBeenCalledWith('user-1', 0, 1);
      expect(result).toEqual(response);
    });
  });
});
