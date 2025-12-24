import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  NEW_OFFER = 'NEW_OFFER',
  RENEWAL_REMINDER = 'RENEWAL_REMINDER',
  PROMOTIONAL = 'PROMOTIONAL',
  VENDOR_APPROVED = 'VENDOR_APPROVED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

export class NotificationQueryDto {
  @ApiProperty({
    description: 'Filter by notification type',
    enum: NotificationType,
    required: false,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({
    description: 'Filter by notification status',
    enum: NotificationStatus,
    required: false,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({
    description: 'Page number (default: 1)',
    required: false,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page (default: 20)',
    required: false,
    example: 20,
  })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
