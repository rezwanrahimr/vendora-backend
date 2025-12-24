import { Module } from '@nestjs/common';
import { AdminNotificationService } from './admin-notification.service';
import { AdminNotificationController } from './admin-notification.controller';

@Module({
  controllers: [AdminNotificationController],
  providers: [AdminNotificationService],
})
export class AdminNotificationModule {}
