import {  ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SaveLanguageDto {
  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;
}

export class SaveSystemDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isUnderMaintenance?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAutoApproveForVendorOn?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isNewVendorRegistrationOn?: boolean;
}
