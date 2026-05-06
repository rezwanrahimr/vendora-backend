import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name?: string;
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;
  @ApiProperty({ description: 'Password', example: 'strongPassword123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
  @ApiProperty({
    description: 'Mobile number of the user',
    example: '+15551234567',
  })
  @IsString()
  @IsNotEmpty()
  mobileNumber!: string;
  @ApiPropertyOptional({
    description: 'Role of the user',
    example: 'USER',
    enum: UserRole,
  })
  role?: UserRole;
}

export class RegisterVendorDto extends RegisterDto {
  @ApiProperty({ description: 'City name', example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city!: string;
  @ApiProperty({ description: 'Street address', example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  streetAddress!: string;
  @ApiProperty({ description: 'Zip code', example: '10001' })
  @IsString()
  @IsNotEmpty()
  zipCode!: string;
  @ApiProperty({ description: 'Category ID', example: 'category-123' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;
  @ApiPropertyOptional({ description: 'Business name', example: 'Acme Inc' })
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Description of the vendor',
    example: 'We sell the best products',
  })
  about?: string;
}
