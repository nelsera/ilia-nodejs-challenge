import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { WalletService } from '../wallet-service.service';
import { InternalJwtAuthGuard } from '../auth/internal/internal-jwt-auth.guard';

@ApiTags('Internal')
@ApiBearerAuth()
@UseGuards(InternalJwtAuthGuard)
@Controller('internal/wallets')
export class InternalWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Get or create wallet for a user (internal only)' })
  @ApiParam({ name: 'userId' })
  createOrGet(@Param('userId') userId: string) {
    return this.walletService.getOrCreateWallet(userId);
  }
}
