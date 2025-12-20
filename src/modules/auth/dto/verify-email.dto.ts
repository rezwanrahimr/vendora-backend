import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;
  @ApiProperty({ description: 'Verification code', example: '123456' })
  code: string;
}
