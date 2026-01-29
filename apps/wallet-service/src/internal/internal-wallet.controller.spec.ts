import { Test, TestingModule } from '@nestjs/testing';

import { InternalWalletController } from './internal-wallet.controller';
import { WalletService } from '../wallet-service.service';

type WalletServiceMock = {
  getOrCreateWallet: jest.Mock;
};

describe('InternalWalletController', () => {
  let controller: InternalWalletController;

  const walletServiceMock: WalletServiceMock = {
    getOrCreateWallet: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalWalletController],
      providers: [{ provide: WalletService, useValue: walletServiceMock }],
    }).compile();

    controller = module.get(InternalWalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createOrGet should call WalletService.getOrCreateWallet with userId', async () => {
    const wallet = { id: 'w1', userId: 'u1' };

    walletServiceMock.getOrCreateWallet.mockResolvedValue(wallet);

    const result = await controller.createOrGet('u1');

    expect(walletServiceMock.getOrCreateWallet).toHaveBeenCalledWith('u1');
    expect(result).toEqual(wallet);
  });
});
