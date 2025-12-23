import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminLegalDto } from './dto/admin-legal.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminLegalService {
  private readonly SINGLETON_ID = 'ADMIN_LEGAL_SINGLETON_ID';

  constructor(private prisma: PrismaService) {}

  async updateAdminLegal(data: AdminLegalDto) {
    const updateData: Partial<{
      TermsAndConditions: string;
      PrivacyPolicy: string;
    }> = {};

    if (data.TermsAndConditions !== undefined) {
      updateData.TermsAndConditions = data.TermsAndConditions;
    }

    if (data.PrivacyPolicy !== undefined) {
      updateData.PrivacyPolicy = data.PrivacyPolicy;
    }

    await this.prisma.adminLegal.upsert({
      where: { id: this.SINGLETON_ID },
      update: updateData,
      create: {
        TermsAndConditions: data.TermsAndConditions || '',
        PrivacyPolicy: data.PrivacyPolicy || '',
      },
    });

    return this.prisma.adminLegal.findUnique({
      where: { id: this.SINGLETON_ID },
      select: {
        id: true,
        TermsAndConditions: true,
        PrivacyPolicy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAdminLegal() {
    const legal = await this.prisma.adminLegal.findUnique({
      where: { id: this.SINGLETON_ID },
      select: {
        id: true,
        TermsAndConditions: true,
        PrivacyPolicy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!legal) {
      throw new NotFoundException('Admin legal data not found');
    }

    return legal;
  }
}
