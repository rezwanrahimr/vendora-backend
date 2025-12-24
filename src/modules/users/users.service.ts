import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SuccessResponse } from '../../common/dto/response.dto';

interface FcmToken {
  token: string;
  platform: string;
  deviceId?: string;
  createdAt: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        notifications: true,
        vendorProfile: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: true,
      },
    });
  }

  async updateUser(id: string, updateData: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare data with proper type conversion
    const dataToUpdate: any = { ...updateData };
    
    // Ensure dateOfBirth is properly formatted if provided
    if (updateData.dateOfBirth) {
      dataToUpdate.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        dateOfBirth: true,
        imageUrl: true,
        role: true,
        status: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
  }

  async uploadUserImage(userId: string, filename: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old image if exists
    if (user.imageUrl) {
      const oldImagePath = join(process.cwd(), user.imageUrl);
      if (existsSync(oldImagePath)) {
        try {
          await unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
    }

    // Update user with new image URL
    const imageUrl = `/uploads/users/images/${filename}`;
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      message: 'Image uploaded successfully',
    };
  }

  async deleteUserImage(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.imageUrl) {
      throw new NotFoundException('User has no profile image');
    }

    // Delete the image file
    const imagePath = join(process.cwd(), user.imageUrl);
    if (existsSync(imagePath)) {
      try {
        await unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Update user to remove image URL
    return this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl: null },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        updatedAt: true,
      },
    });
  }

  async updateNotificationPreferences(userId: string, data: { newOffer?: boolean; renewalReminder?: boolean; promotional?: boolean }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notifications: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if notification preferences exist
    if (user.notifications.length === 0) {
      // Create notification preferences if they don't exist
      return this.prisma.userNotification.create({
        data: {
          userId,
          newOffer: data.newOffer ?? true,
          renewalReminder: data.renewalReminder ?? true,
          promotional: data.promotional ?? true,
        },
      });
    }

    // Update existing notification preferences
    return this.prisma.userNotification.update({
      where: { id: user.notifications[0].id },
      data,
    });
  }

  /**
   * Register FCM token for push notifications
   */
  async registerFcmToken(
    userId: string,
    token: string,
    platform: string,
    deviceId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingTokens = (user.fcmTokens as unknown as FcmToken[]) || [];

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

      return new SuccessResponse('FCM token registered successfully', {
        registered: true,
      });
    }

    // Update last active time even if token exists
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });

    return new SuccessResponse('FCM token already registered', {
      registered: false,
    });
  }

  /**
   * Remove FCM token
   */
  async removeFcmToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingTokens = (user.fcmTokens as unknown as FcmToken[]) || [];
    const updatedTokens = existingTokens.filter((t) => t.token !== token);

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmTokens: updatedTokens as any },
    });

    return new SuccessResponse('FCM token removed successfully');
  }
}
