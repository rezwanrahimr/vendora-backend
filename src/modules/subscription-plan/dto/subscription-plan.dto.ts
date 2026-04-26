import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    example: 'Premium Plan',
    description: 'Name of the subscription plan',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Access to all premium features',
    description: 'Description of the subscription plan',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 999.99,
    description: 'Price of the subscription plan',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiProperty({
    example: 365,
    description: 'Duration of the plan in days',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationInDays!: number;

  @ApiProperty({
    example: 'USD',
    description: 'Currency of the plan',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({
    example: '80 RSD/month',
    description: 'Human-readable display price',
  })
  @IsString()
  @IsNotEmpty()
  currentPriceDisplay!: string;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({
    example: 'Premium Plan',
    description: 'Name of the subscription plan',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Access to all premium features',
    description: 'Description of the subscription plan',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 999.99,
    description: 'Price of the subscription plan',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: 365,
    description: 'Duration of the plan in days',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  durationInDays?: number;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Currency of the plan',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: '80 RSD/month',
    description: 'Human-readable display price',
  })
  @IsString()
  @IsOptional()
  currentPriceDisplay?: string;
}
