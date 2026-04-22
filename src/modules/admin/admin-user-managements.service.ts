import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminUserManagementsService {
  constructor(private readonly prisma: PrismaService) {}

  async allUsers(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Base filter
    const baseWhere: Prisma.UserWhereInput = {
      role: 'USER',
      isDeleted: false,
    };

    // Search filter
    const where: Prisma.UserWhereInput = search
      ? {
          ...baseWhere,
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : baseWhere;

    const [total, totalUsers, totalSuspended, users] = await Promise.all([
      // Pagination total (filtered)
      this.prisma.user.count({ where }),

      // Total users (no search, but still respect isDeleted)
      this.prisma.user.count({
        where: baseWhere,
      }),

      // Suspended users (also respect role + isDeleted)
      this.prisma.user.count({
        where: {
          ...baseWhere,
          status: 'SUSPENDED',
        },
      }),

      // Paginated users
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: { offerRedemptions: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedUsers = users.map((user) => ({
      ...user,
      redeemedOfferCount: user._count.offerRedemptions,
    }));

    return {
      statistics: {
        totalUsers,
        suspendedUsers: totalSuspended,
      },
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async suspendUser(id: string) {
    // First, get current status (lightweight)
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { status: true, role: true, isDeleted: true },
    });

    if (!user || user.role !== 'USER' || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    const result = await this.prisma.user.updateMany({
      where: {
        id,
        role: 'USER',
        isDeleted: false,
      },
      data: { status: newStatus },
    });

    if (result.count === 0) {
      throw new NotFoundException('User not found or already updated');
    }

    return {
      message:
        newStatus === 'SUSPENDED'
          ? 'User suspended successfully'
          : 'User activated successfully',
    };
  }

  async deleteUser(id: string) {
    // Validate target
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true, isDeleted: true },
    });

    if (!user || user.isDeleted || user.role !== 'USER') {
      throw new NotFoundException('User not found');
    }

    // Perform delete with safeguard conditions
    const result = await this.prisma.user.deleteMany({
      where: {
        id,
        role: 'USER',
        isDeleted: false,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('User not found or already deleted');
    }

    return { message: 'User deleted successfully' };
  }
}
