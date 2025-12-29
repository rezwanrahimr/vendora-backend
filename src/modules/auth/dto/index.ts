import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export * from './register.dto';
export * from './login.dto';
export * from './verify-email.dto';
export * from './forgot-password.dto';
export * from './reset-password.dto';
export * from './confirm-reset-password.dto';
export * from './change-password.dto';

export class LoginWithGoogleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Full name of the user', example: 'John Doe' })
  name: string;



  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Image URL of the user',
    example: 'https://example.com/avatar.jpg',
  })
  imageUrl?: string;
}
