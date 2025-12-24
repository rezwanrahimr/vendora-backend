import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PushNotificationDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Turn all push notifications on or off. Default: true.',
  })
  enablePushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Get notifications for new offers. Default: true.',
  })
  newOfferNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Get notifications before offers expire. Default: true.',
  })
  expiryOfferNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Get subscription renewal reminders. Default: true.',
  })
  subscriptionRenewalReminders?: boolean;
}

export class EmailNotificationDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Turn all email notifications on or off. Default: true.',
  })
  enableEmailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: true,
    description: 'Receive a weekly summary email. Default: true.',
  })
  weeklyDigest?: boolean;
}
