import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PrivacyPolicyDto, TermsAndConditionsDto } from './dto/admin-legal.dto';

@Injectable()
export class AdminLegalService {
  private readonly SINGLETON_ID = 'ADMIN_LEGAL_SINGLETON_ID';

  constructor(private prisma: PrismaService) {}

  async saveTermsAndConditions(payload: TermsAndConditionsDto) {
    const data = payload.TermsAndConditions?.trim();

    // If nothing is provided, do nothing
    if (data === undefined) return this.getAdminLegal();

    return this.prisma.adminLegal.upsert({
      where: { id: this.SINGLETON_ID },
      update: { TermsAndConditions: data },
      create: {
        id: this.SINGLETON_ID,
        TermsAndConditions: data,
        PrivacyPolicy: '',
      },
    });
  }

  async savePrivacyPolicy(payload: PrivacyPolicyDto) {
    const data = payload.PrivacyPolicy?.trim();

    // If nothing is provided, do nothing
    if (data === undefined) return this.getAdminLegal();

    return this.prisma.adminLegal.upsert({
      where: { id: this.SINGLETON_ID },
      update: { PrivacyPolicy: data },
      create: {
        id: this.SINGLETON_ID,
        PrivacyPolicy: data,
        TermsAndConditions: '',
      },
    });
  }

  async getAdminLegal() {
    return this.prisma.adminLegal.upsert({
      where: { id: this.SINGLETON_ID },
      update: {},
      create: {
        id: this.SINGLETON_ID,
        TermsAndConditions: 'Terms and Conditions',
        PrivacyPolicy: 'Privacy Policy',
      },
      select: {
        id: true,
        TermsAndConditions: true,
        PrivacyPolicy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
