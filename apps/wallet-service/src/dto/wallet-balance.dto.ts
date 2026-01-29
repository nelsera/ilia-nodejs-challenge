import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceDto {
  @ApiProperty() walletId!: string;
  @ApiProperty() userId!: string;

  @ApiProperty({ example: 500, description: 'Balance in cents' })
  balance!: number;

  @ApiProperty({ example: 1000 }) credits!: number;
  @ApiProperty({ example: 500 }) debits!: number;
}
