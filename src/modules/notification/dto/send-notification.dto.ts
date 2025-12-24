import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from './notification-query.dto';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'New Offer Available!',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'Check out the new BOGO offer from Bella Vista Restaurant',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.NEW_OFFER,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'Additional data payload for deep linking or extra info',
    example: { offerId: '123', screen: 'OfferDetail' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
