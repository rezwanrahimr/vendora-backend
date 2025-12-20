import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;
  @ApiProperty({ description: 'Password', example: 'strongPassword123' })
  password: string;
}
