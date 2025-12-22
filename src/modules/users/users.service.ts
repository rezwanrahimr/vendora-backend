import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
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

  async updateUser(id: number, data: { name?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });
  }

  async uploadUserImage(userId: number, filename: string) {
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

  async deleteUserImage(userId: number) {
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

  async updateNotificationPreferences(userId: number, data: { newOffer?: boolean; renewalReminder?: boolean; promotional?: boolean }) {
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
}
