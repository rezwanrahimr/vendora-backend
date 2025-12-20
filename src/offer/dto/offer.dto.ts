import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus, OfferType } from '@prisma/client';

export class CreateOfferDto {
  @ApiProperty({
    example: 'Summer Sale',
    description: 'Title of the offer shown to users',
  })
  title: string;

  @ApiProperty({
    example: 'Get 20% off on all products until the end of summer',
    description: 'Detailed description of the offer',
  })
  description: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether the offer can be reused multiple times by the same user',
    default: false,
  })
  isReusable?: boolean;

  // TODO: later it must be string
  @ApiProperty({
    example: 1,
    description: 'ID of the vendor creating the offer',
  })
  vendorId: number;

  @ApiPropertyOptional({
    example: 100,
    description:
      'Maximum number of times the offer can be redeemed (null means unlimited)',
    nullable: true,
  })
  maxRedemptions?: number | null;

  @ApiProperty({
    enum: OfferType,
    example: OfferType.DISCOUNT,
    description: 'Type of the offer',
  })
  type: OfferType;

  @ApiPropertyOptional({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Offer start date (ISO 8601 format)',
  })
  validFrom?: string | Date;

  @ApiProperty({
    example: '2025-01-31T23:59:59.000Z',
    description: 'Offer expiration date (ISO 8601 format)',
  })
  validUntil: string | Date;
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
