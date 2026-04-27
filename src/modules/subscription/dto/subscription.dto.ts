import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  Length,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class SubscriptionCheckoutDto {
  @ApiProperty({
    example: 'plan_123abc',
    description: 'ID of the subscription plan the user wants to purchase',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  subscriptionPlanId!: string;

  @ApiProperty({
    example: 'c0f1c7c2-8b6a-4b3e-9d8a-1a2b3c4d5e6f',
    description:
      'Client-generated idempotency key (UUID v4) to prevent duplicate payments',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  idempotencyKey!: string;

  @ApiPropertyOptional({
    example: 'SAVE10',
    description: 'Optional promo/discount code applied to the subscription',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  promoCode?: string;
}

export class FreeSubscriptionDto {
  @ApiProperty({
    description: 'User ID who will receive the free subscription',
    example: 'a3f1c2d4-5678-4b9a-8cde-1234567890ab',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Subscription plan ID for the free subscription',
    example: 'b7e2d9f0-1234-4abc-9def-0987654321cd',
  })
  @IsUUID()
  planId!: string;

  @ApiPropertyOptional({
    description:
      'Reason for granting the free subscription (e.g., trial, promo, admin_granted)',
    example: 'trial',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  freeReason?: string;

  @ApiPropertyOptional({
    description:
      'Optional custom start date for the subscription (ISO 8601 format). Defaults to now if not provided',
    example: '2026-04-27T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  subscriptionStartDate?: Date;
}
