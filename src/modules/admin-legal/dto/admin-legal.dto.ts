import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class AdminLegalDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    description: 'Terms and Conditions content',
    required: false,
  })
  TermsAndConditions?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    description: 'Privacy Policy content',
    required: false,
  })
  PrivacyPolicy?: string;
}
