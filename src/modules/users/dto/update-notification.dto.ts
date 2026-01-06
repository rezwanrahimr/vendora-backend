import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({
    required: false,
    example: true,
    description: 'Receive notifications for new offers',
  })
  @IsOptional()
  @IsBoolean()
  newOffer?: boolean;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Receive renewal reminder notifications',
  })
  @IsOptional()
  @IsBoolean()
  renewalReminder?: boolean;

  @ApiProperty({
    required: false,
    example: false,
    description: 'Receive promotional notifications',
  })
  @IsOptional()
  @IsBoolean()
  promotional?: boolean;
}
