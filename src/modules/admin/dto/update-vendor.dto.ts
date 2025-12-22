import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VendorUpdateDto {
    @ApiPropertyOptional({ description: 'Business name' })
    @IsOptional()
    @IsString()
    businessName?: string;

    @ApiPropertyOptional({ description: 'Zip code' })
    @IsOptional()
    @IsString()
    zipCode?: string;

    @ApiPropertyOptional({ description: 'City' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'Street address' })
    @IsOptional()
    @IsString()
    streetAddress?: string;

    @ApiPropertyOptional({ description: 'Contact email' })
    @IsOptional()
    @IsEmail()
    contactEmail?: string;
}