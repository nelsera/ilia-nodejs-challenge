import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DebitWalletDto {
  @ApiProperty({ example: 500, description: 'Amount in cents' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Purchase #123' })
  @IsOptional()
  @IsString()
  description?: string;
}
