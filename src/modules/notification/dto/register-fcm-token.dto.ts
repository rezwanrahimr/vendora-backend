import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM token from Firebase SDK',
    example: 'dK7X9fR3QK-2nY...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
  })
  @IsEnum(DevicePlatform)
  @IsNotEmpty()
  platform: DevicePlatform;

  @ApiProperty({
    description: 'Unique device identifier',
    example: 'abc123-device-id',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
