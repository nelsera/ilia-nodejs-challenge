import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class DebitWalletDto {
  @ApiProperty({ example: 'b3b2b4cc-7a9c-4b0c-9c4d-2a8e0c9b2a11' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 500, description: 'Amount in cents' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Purchase #123' })
  @IsOptional()
  @IsString()
  description?: string;
}
