import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { WalletService } from './wallet-service.service';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from './auth/current-user.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('me')
  @ApiOperation({ summary: 'Get or create my wallet' })
  createOrGet(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getOrCreateWallet(user.sub);
  }

  @Post('me/credit')
  @ApiOperation({ summary: 'Credit my wallet (amount in cents)' })
  @ApiOkResponse({ type: WalletBalanceDto })
  credit(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreditWalletDto) {
    return this.walletService.credit(user.sub, dto.amount, dto.description);
  }

  @Post('me/debit')
  @ApiOperation({ summary: 'Debit my wallet (amount in cents)' })
  @ApiOkResponse({ type: WalletBalanceDto })
  debit(@CurrentUser() user: CurrentUserPayload, @Body() dto: DebitWalletDto) {
    return this.walletService.debit(user.sub, dto.amount, dto.description);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my wallet' })
  getWallet(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getWalletByUserId(user.sub);
  }

  @Get('me/balance')
  @ApiOperation({ summary: 'Get my wallet balance' })
  @ApiOkResponse({ type: WalletBalanceDto })
  getBalance(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getBalance(user.sub);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'List my wallet transactions' })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 20 })
  listTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ) {
    return this.walletService.listTransactions(user.sub, skip ?? 0, take ?? 20);
  }
}
