import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'New York, USA' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, example: '1990-01-01', description: 'Date of birth in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
