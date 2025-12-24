import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FirebaseService } from './firebase.service';
import {
  NotificationStatus,
  NotificationType,
  SendNotificationDto,
} from './dto';

export interface FcmToken {
  token: string;
  platform: string;
  deviceId?: string;
  createdAt: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Helper method to safely parse FCM tokens from JSON field
   */
  private parseFcmTokens(fcmTokensData: any): FcmToken[] {
    if (!fcmTokensData) return [];
    
    if (Array.isArray(fcmTokensData)) {
      return fcmTokensData as FcmToken[];
    }
    
    // Handle case where it might be stored as a single object
    if (typeof fcmTokensData === 'object' && fcmTokensData.token) {
      return [fcmTokensData] as FcmToken[];
    }
    
    return [];
  }

  /**
   * Register a new FCM token for a user
   */
  async registerFcmToken(
    userId: string,
    token: string,
    platform: string,
    deviceId?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const existingTokens = this.parseFcmTokens(user.fcmTokens);

    // Check if token already exists
    const tokenExists = existingTokens.some((t) => t.token === token);

    if (!tokenExists) {
      // Add new token
      const newToken: FcmToken = {
        token,
        platform,
        deviceId,
        createdAt: new Date().toISOString(),
      };

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          fcmTokens: [...existingTokens, newToken] as any,
          lastActiveAt: new Date(),
        },
      });

      this.logger.log(`FCM token registered for user ${userId}`);
    } else {
      // Update last active time
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    }
  }

  /**
   * Remove an FCM token for a user
   */
  async removeFcmToken(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const existingTokens = this.parseFcmTokens(user.fcmTokens);
    const updatedTokens = existingTokens.filter((t) => t.token !== token);

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmTokens: updatedTokens as any },
    });

    this.logger.log(`FCM token removed for user ${userId}`);
  }

  /**
   * Remove invalid tokens from a user's record
   */
  async removeInvalidTokens(
    userId: string,
    invalidTokens: string[],
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const existingTokens = this.parseFcmTokens(user.fcmTokens);
    const updatedTokens = existingTokens.filter(
      (t) => !invalidTokens.includes(t.token),
    );

    if (updatedTokens.length !== existingTokens.length) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmTokens: updatedTokens as any },
      });

      this.logger.log(
        `Removed ${existingTokens.length - updatedTokens.length} invalid tokens for user ${userId}`,
      );
    }
  }

  /**
   * Send a notification to a specific user
   */
  async sendToUser(
    userId: string,
    notificationDto: SendNotificationDto,
  ): Promise<{ success: boolean; notificationId?: string }> {
    // Create notification record
    const notification = await this.prisma.pushNotification.create({
      data: {
        userId,
        title: notificationDto.title,
        body: notificationDto.body,
        type: notificationDto.type,
        data: notificationDto.data || {},
        status: NotificationStatus.PENDING,
      },
    });

    // Get user's FCM tokens
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notifications: true },
    });

    if (!user) {
      await this.prisma.pushNotification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
      return { success: false };
    }

    // Check user's notification preferences
    const preferences = user.notifications[0];
    if (preferences) {
      const shouldSend = this.shouldSendBasedOnPreferences(
        notificationDto.type,
        preferences,
      );

      if (!shouldSend) {
        this.logger.log(
          `User ${userId} has disabled ${notificationDto.type} notifications`,
        );
        await this.prisma.pushNotification.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.FAILED },
        });
        return { success: false };
      }
    }

    // Parse FCM tokens using helper method
    const fcmTokens = this.parseFcmTokens(user.fcmTokens);

    if (fcmTokens.length === 0) {
      this.logger.warn(`User ${userId} has no FCM tokens`);
      await this.prisma.pushNotification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
      return { success: false };
    }

    // Send to all user's devices
    const tokens = fcmTokens.map((t) => t.token);
    const dataPayload = notificationDto.data
      ? this.convertDataToStringMap(notificationDto.data)
      : undefined;

    const result = await this.firebaseService.sendToMultipleDevices(
      tokens,
      {
        title: notificationDto.title,
        body: notificationDto.body,
      },
      dataPayload,
    );

    // Remove invalid tokens
    if (result.invalidTokens.length > 0) {
      await this.removeInvalidTokens(userId, result.invalidTokens);
    }

    // Update notification status
    const status =
      result.successCount > 0
        ? NotificationStatus.SENT
        : NotificationStatus.FAILED;

    await this.prisma.pushNotification.update({
      where: { id: notification.id },
      data: {
        status,
        sentAt: result.successCount > 0 ? new Date() : null,
      },
    });

    return {
      success: result.successCount > 0,
      notificationId: notification.id,
    };
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    notificationDto: SendNotificationDto,
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, notificationDto);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  /**
   * Get user's notification history
   */
  async getUserNotifications(
    userId: string,
    type?: NotificationType,
    status?: NotificationStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [notifications, total] = await Promise.all([
      this.prisma.pushNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pushNotification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.pushNotification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.pushNotification.count({
      where: {
        userId,
        status: {
          in: [NotificationStatus.PENDING, NotificationStatus.SENT],
        },
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.pushNotification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendBasedOnPreferences(
    type: NotificationType,
    preferences: any,
  ): boolean {
    switch (type) {
      case NotificationType.NEW_OFFER:
        return preferences.newOffer ?? true;
      case NotificationType.RENEWAL_REMINDER:
        return preferences.renewalReminder ?? true;
      case NotificationType.PROMOTIONAL:
        return preferences.promotional ?? true;
      case NotificationType.VENDOR_APPROVED:
      case NotificationType.SYSTEM:
        return true; // Always send system notifications
      default:
        return true;
    }
  }

  /**
   * Convert data object to string map (required by FCM)
   */
  private convertDataToStringMap(
    data: Record<string, any>,
  ): Record<string, string> {
    const stringMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringMap[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return stringMap;
  }
}
