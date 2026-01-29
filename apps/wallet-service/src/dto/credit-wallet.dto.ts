import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreditWalletDto {
  @ApiProperty({ example: 1000, description: 'Amount in cents' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Signup bonus' })
  @IsOptional()
  @IsString()
  description?: string;
}
