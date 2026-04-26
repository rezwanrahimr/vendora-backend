import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, Length } from 'class-validator';

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
}