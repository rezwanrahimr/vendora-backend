import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
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

  @ApiProperty({
    example: 'Access to all premium features',
    description: 'Description of the subscription plan',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

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
}
