import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVendorDto {
  @ApiPropertyOptional({
    example: 'Acme Pet Services Ltd.',
  })
  businessName?: string;

  @ApiPropertyOptional({
    example: 'Springfield',
  })
  city?: string;

  @ApiPropertyOptional({
    example: '742 Evergreen Terrace',
  })
  streetAddress?: string;

  @ApiPropertyOptional({
    example: '54321',
  })
  zipCode?: string;

  @ApiPropertyOptional({
    example: 'info@acmepets.fake',
  })
  contactEmail?: string;

  @ApiPropertyOptional({
    example: '+1-555-0199',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'FAKE-TAX-123456',
  })
  taxId?: string;

  @ApiPropertyOptional({
    example: 'A fictional company providing premium pet care services.',
  })
  description?: string;
}
