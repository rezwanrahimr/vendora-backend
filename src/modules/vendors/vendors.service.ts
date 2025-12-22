import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: 'VENDOR' },
      include: {
        vendorProfile: true,
      },
    });
  }

  async findOne(id: number) {
    const vendor = await this.prisma.user.findFirst({
      where: { 
        id,
        role: 'VENDOR',
      },
      include: {
        vendorProfile: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const { password, ...vendorWithoutPassword } = vendor;
    return vendorWithoutPassword;
  }

  async updateVendorProfile(userId: number, data: {
    businessName?: string;
    businessAddress?: string;
    phoneNumber?: string;
    taxId?: string;
    description?: string;
  }) {
    const vendor = await this.prisma.user.findFirst({
      where: { id: userId, role: 'VENDOR' },
      include: { vendorProfile: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendorProfile.update({
      where: { userId },
      data,
    });
  }

  async verifyVendor(userId: number) {
    const vendor = await this.prisma.user.findFirst({
      where: { id: userId, role: 'VENDOR' },
      include: { vendorProfile: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendorProfile.update({
      where: { userId },
      data: { isVerified: true },
    });
  }
}
