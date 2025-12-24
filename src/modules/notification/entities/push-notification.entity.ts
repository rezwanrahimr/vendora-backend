import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus, NotificationType } from '../dto';

export class PushNotificationEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ nullable: true })
  data?: Record<string, any>;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty({ nullable: true })
  sentAt?: Date;

  @ApiProperty({ nullable: true })
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<PushNotificationEntity>) {
    Object.assign(this, partial);
  }
}
