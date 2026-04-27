import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsDateString,
  Max,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePromoCodeDto {
  @ApiProperty({
    example: 'SAVE10',
    description: 'Unique promo code',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase().trim())
  code!: string;

  @ApiProperty({
    example: 'PERCENTAGE',
    description: 'Type of promo code (e.g. Free Trial, Percentage Discount)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase().trim())
  type!: string;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage (0-100)',
  })
  @IsNumber()
  @IsPositive()
  @Max(100)
  discountPercentage!: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum number of times this code can be used',
  })
  @IsInt()
  @Min(1)
  maxUsages!: number;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Expiry date (ISO format)',
  })
  @IsDateString()
  expiryDate!: Date;
}

export class UpdatePromoCodeDto {
  @ApiPropertyOptional({
    example: 'SAVE10',
    description: 'Unique promo code',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase().trim())
  code?: string;

  @ApiPropertyOptional({
    example: 'PERCENTAGE',
    description: 'Type of promo code',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase().trim())
  type?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount percentage (0-100)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of usages',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsages?: number;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Expiry date (ISO format)',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}