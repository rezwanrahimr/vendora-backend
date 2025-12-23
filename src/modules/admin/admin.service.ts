import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from '../auth/email.service';
import { VendorUpdateDto } from './dto/update-vendor.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async dashboardStatus() {
    const totalVendors = await this.prisma.user.count({
      where: { role: 'VENDOR' },
    });

    const totalUsers = await this.prisma.user.count({
      where: { role: 'USER' },
    });

    const activeOffers = await this.prisma.offer.count({
      where: { status: 'ACTIVE' },
    });

    const redeemedOffers = await this.prisma.offerRedemptionEvent.count();

    return {
      totalVendors,
      totalUsers,
      activeOffers,
      redeemedOffers,
    };
  }

  async getProfile(id: string) {
    const admin = await this.prisma.user.findFirst({
      where: { id, role: 'ADMIN' },
      select: {
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        location: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return admin;
  }

  async usersStatus() {
    const totalUsers = await this.prisma.user.count();
    const activeSubscriptions = 0;
    const expiredSubscriptions = 0;
    const suspendedUsersCount = await this.prisma.user.findMany({
      where: { status: 'SUSPENDED' },
    });

    return {
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedUsers: suspendedUsersCount.length,
    };
  }

  async allUsers(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Build the where condition
    const where: any = {
      role: 'USER',
    };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get paginated users
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
    return { message: 'User deleted successfully' };
  }

  async allVendors(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Build the where condition
    const where: any = {
      role: 'VENDOR',
    };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get paginated users
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to include offers count
    const transformedUsers = await Promise.all(
      users.map(async (user) => {
        const offersCount = await this.prisma.offer.count({
          where: {
            VendorProfile: {
              userId: user.id,
            },
          },
        });

        return {
          ...user,
          offersCount,
        };
      }),
    );

    return {
      users: transformedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async approvedVendor(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'VENDOR') {
      throw new Error('Vendor not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.emailService.sendEmail({
      subject: 'Vendor Account Approved',
      to: user.email,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Congratulations!</h2>
          <p>Your vendor account has been approved. You can now start using our platform to offer your products and services.</p>
          <p>Thank you for joining us!</p>
        </div>
      `,
    });

    return { message: 'Vendor approved successfully' };
  }

  async updateVendor(id: string, updateData: VendorUpdateDto) {
    // Check if user exists and is a vendor
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { vendorProfile: true },
    });

    if (!user || user.role !== 'VENDOR') {
      throw new Error('Vendor not found');
    }

    if (!user.vendorProfile) {
      throw new Error('Vendor profile not found');
    }

    // Update vendor profile
    const vendorProfile = await this.prisma.vendorProfile.update({
      where: { userId: id },
      data: updateData,
    });

    return { message: 'Vendor updated successfully', vendorProfile };
  }

  async deleteVendor(id: string) {
    // Check if user exists and is a vendor
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!user || user.role !== 'VENDOR') {
      throw new Error('Vendor not found');
    }

    // Delete user (cascade will delete vendor profile and offers)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Vendor deleted successfully' };
  }
}
