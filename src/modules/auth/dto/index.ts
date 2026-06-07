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
  @ApiProperty({
    description:
      'Firebase ID token generated after Google sign-in in the mobile app',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ik...',
  })
  idToken: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Optional FCM token for the device',
    example: 'fcm-device-token',
  })
  fcmToken?: string;
}
