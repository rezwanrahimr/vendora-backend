import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  EmailNotificationDto,
  PushNotificationDto,
} from './dto/admin-notification.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SINGLETON_ID = 'ADMIN_NOTIFICATION_SINGLETON_ID';

  async savePushNotificationSettings(payload: PushNotificationDto) {
    const data = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as Partial<PushNotificationDto>;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No settings provided to update');
    }

    return await this.prisma.adminNotification.upsert({
      where: { id: this.SINGLETON_ID },
      update: data,
      create: {
        id: this.SINGLETON_ID,
        ...data,
      },
    });
  }

  async saveEmailNotificationSettings(payload: EmailNotificationDto) {
    const data = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as Partial<EmailNotificationDto>;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No settings provided to update');
    }

    return await this.prisma.adminNotification.upsert({
      where: { id: this.SINGLETON_ID },
      update: data,
      create: {
        id: this.SINGLETON_ID,
        ...data,
      },
    });
  }

  async getAdminNotification() {
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id: this.SINGLETON_ID },
    });

    if (!notification) {
      throw new NotFoundException('Admin notification data not found');
    }

    return notification;
  }
}
