import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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
}
