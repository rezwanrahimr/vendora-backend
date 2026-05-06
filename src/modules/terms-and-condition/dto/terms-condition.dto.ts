import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AddTermsAndConditionDto {
  @ApiProperty({
    example: 'These are the terms and conditions...',
    description: 'Full content of the Terms and Conditions',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, {
    message: 'Content must be at least 50 characters long',
  })
  content!: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this version should be active immediately',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}


export class UpdateTermsAndConditionDto {
  @ApiPropertyOptional({
    example: 'Updated terms and conditions content...',
    description: 'Updated content of Terms and Conditions',
  })
  @IsString()
  @IsOptional()
  @MinLength(50, {
    message: 'Content must be at least 50 characters long',
  })
  content?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Set whether this version should be active',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}