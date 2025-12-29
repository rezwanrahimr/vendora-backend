import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name?: string;
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;
  @ApiProperty({ description: 'Password', example: 'strongPassword123' })
  password: string;
  @ApiPropertyOptional({
    description: 'Role of the user',
    example: 'USER',
    enum: UserRole,
  })
  role?: UserRole;
}

export class RegisterVendorDto extends RegisterDto {
  @ApiProperty({ description: 'City name', example: 'New York' })
  city: string;
  @ApiProperty({ description: 'Street address', example: '123 Main St' })
  streetAddress: string;
  @ApiProperty({ description: 'Zip code', example: '10001' })
  zipCode: string;
  @ApiProperty({ description: 'Category ID', example: 'category-123' })
  categoryId: string;
  @ApiPropertyOptional({ description: 'Business name', example: 'Acme Inc' })
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Description of the vendor',
    example: 'We sell the best products',
  })
  about?: string;
}
