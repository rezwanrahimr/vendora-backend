import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveFcmTokenDto {
  @ApiProperty({
    description: 'FCM token to remove',
    example: 'dK7X9fR3QK-2nY...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
