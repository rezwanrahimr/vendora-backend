import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus, OfferType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({
    example: 'Summer Sale',
    description: 'Title of the offer shown to users',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  // 👇 ADD THIS
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Offer image file',
  })
  image?: any;

  @ApiProperty({
    example: 'Get 20% off on all products until the end of summer',
    description: 'Detailed description of the offer',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether the offer can be reused multiple times by the same user',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isReusable?: boolean;

  @ApiProperty({
    example: 'vendor-12345',
    description: 'ID of the vendor creating the offer',
  })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiPropertyOptional({
    example: 100,
    description:
      'Maximum number of times the offer can be redeemed (leave empty for unlimited)',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxRedemptions?: number | null;

  @ApiProperty({
    enum: OfferType,
    example: OfferType.DISCOUNT,
    description: 'Type of the offer',
  })
  type: OfferType;

  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00.000Z',
    description:
      'Offer start date (ISO 8601 format). Leave empty to start immediately.',
  })
  @IsOptional()
  validFrom?: string | Date;

  @ApiProperty({
    example: '2025-01-31T23:59:59.000Z',
    description: 'Offer expiration date (ISO 8601 format)',
  })
  validUntil: string | Date;

  @ApiPropertyOptional({
    example: 30,
    description:
      'Cooldown period in days before the offer can be reused. Only applies if isReusable is true.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  cooldownPeriod?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Estimated value of the offer in the vendor’s currency',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  estimatedValue?: number;

  @ApiPropertyOptional({
    example: 'Terms and conditions for using this offer',
    description: 'Optional terms and conditions text for this offer',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;
}

export class UpdateOfferStatusDto {
  @ApiProperty({
    description:
      'The new status of the offer (ACTIVE, PENDING, INACTIVE, SUSPENDED)',
    enum: OfferStatus,
    example: OfferStatus.ACTIVE,
  })
  status: OfferStatus;
}

export class GetOffersQueryDto {
  @ApiPropertyOptional({
    example: 'summer',
    description: 'Search term to filter offers by title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: OfferStatus,
    description: 'Filter offers by status',
  })
  @IsOptional()
  status?: OfferStatus;

  @ApiPropertyOptional({
    enum: OfferType,
    description: 'Filter offers by type',
  })
  @IsOptional()
  type?: OfferType;

  @ApiPropertyOptional({
    description: 'Filter offers by reusable flag',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isReusable?: boolean;

  @ApiPropertyOptional({
    description: 'Filter offers by vendor ID',
    example: 'vendor-12345',
  })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of offers per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['createdAt', 'title', 'redeemedCount', 'validUntil'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'title' | 'redeemedCount' | 'validUntil';

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class GetVendorOffersQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of offers per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: 'summer',
    description: 'Search term to filter offers by title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: OfferStatus,
    description: 'Filter offers by status',
  })
  @IsOptional()
  status?: OfferStatus;

  @ApiPropertyOptional({
    enum: OfferType,
    description: 'Filter offers by type',
  })
  @IsOptional()
  type?: OfferType;
}

export class RedeemOfferDto {
  @ApiProperty({
    example: 'offer-12345',
    description: 'ID of the offer to redeem',
  })
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address of the customer redeeming the offer',
  })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;
}

export class GetOfferByCategoryIdDto {
  @ApiPropertyOptional({
    example: 'category-12345',
    description: 'ID of the category',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Number of offers to return',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
