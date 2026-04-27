import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from '../auth/email.service';
import { UpdateVendorProfileDto } from '../vendors/vendor.dto';

@Injectable()
export class AdminVendorManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async allVendors(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: 'VENDOR',
      isDeleted: false,
      vendorProfile: { isDeleted: false },
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),

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
          vendorProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ✅ group offers by vendorId
    const offerCounts = await this.prisma.offer.groupBy({
      by: ['vendorId'],
      where: {
        isDeleted: false,
      },
      _count: {
        _all: true,
      },
    });

    const offerMap = new Map(
      offerCounts.map((o) => [o.vendorId, o._count._all]),
    );

    const transformedUsers = users.map((user) => {
      const vendorId = user.vendorProfile?.id;

      return {
        ...user,
        offersCount: vendorId ? offerMap.get(vendorId) || 0 : 0,
      };
    });

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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
      },
    });

    if (!user || user.role !== 'VENDOR' || user.isDeleted) {
      throw new NotFoundException('Vendor not found');
    }

    if (user.status === 'ACTIVE') {
      return { message: 'Vendor is already approved' };
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    try {
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
    } catch (error) {
      // log but don’t break flow
      console.error('Email sending failed:', error);
    }

    return { message: 'Vendor approved successfully' };
  }

  async rejectVendor(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
      },
    });

    if (!user || user.role !== 'VENDOR' || user.isDeleted) {
      throw new NotFoundException('Vendor not found');
    }

    // ✅ Idempotency check
    if (user.status === 'REJECTED') {
      return { message: 'Vendor is already rejected' };
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    try {
      await this.emailService.sendEmail({
        subject: 'Vendor Account Rejected',
        to: user.email,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Sorry!</h2>
            <p>Your vendor account has been rejected. Please contact our support team for further information.</p>
            <p>Thank you for your understanding.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    return { message: 'Vendor rejected successfully' };
  }

  async updateVendor(id: string, updateData: UpdateVendorProfileDto) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // 🔒 Phone uniqueness check (safer scope)
    if (updateData.phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          phone: updateData.phone,
          NOT: { id: vendor.user.id },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    const { phone, ...vendorFields } = updateData;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendorProfile.update({
        where: { id },
        data: {
          businessName: vendorFields.businessName,
          streetAddress: vendorFields.streetAddress,
          city: vendorFields.city,
          contactEmail: vendorFields.contactEmail,
        },
      });

      const updatedUser = phone
        ? await tx.user.update({
            where: { id: vendor.user.id },
            data: { phone },
          })
        : vendor.user;

      return { updatedVendor, updatedUser };
    });

    return {
      message: 'Vendor updated successfully',
      vendor: result.updatedVendor,
      user: result.updatedUser,
    };
  }

  async deleteVendor(id: string) {
    const vendor = await this.prisma.user.findUnique({
      where: { id },
      include: { vendorProfile: true },
    });

    if (!vendor || vendor.role !== 'VENDOR') {
      throw new NotFoundException('Vendor not found');
    }

    if (!vendor.vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (vendor.isDeleted || vendor.vendorProfile.isDeleted) {
      throw new BadRequestException('Vendor already deleted');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      }),

      this.prisma.vendorProfile.update({
        where: { id: vendor.vendorProfile.id },
        data: { isDeleted: true },
      }),
    ]);

    return { message: 'Vendor deleted successfully' };
  }
}
