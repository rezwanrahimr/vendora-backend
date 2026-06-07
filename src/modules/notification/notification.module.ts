import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma.module';
import { FirebaseService } from './firebase.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [FirebaseService, PushNotificationService],
  controllers: [NotificationController],
  exports: [FirebaseService, PushNotificationService],
})
export class NotificationModule {}
