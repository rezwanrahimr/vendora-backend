import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async dashboardStatus() {
    const [totalVendors, totalUsers, activeOffers, redeemedOffers] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'VENDOR' } }),
        this.prisma.user.count({ where: { role: 'USER' } }),
        this.prisma.offer.count({ where: { status: 'ACTIVE' } }),
        this.prisma.offerRedemptionEvent.count(),
      ]);

    return {
      totalVendors,
      totalUsers,
      activeOffers,
      redeemedOffers,
    };
  }

  async usersStatus() {
    const [
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.groupBy({
        by: ['userId'],
        where: { status: 'ACTIVE' },
      }),
      this.prisma.subscription.groupBy({
        by: ['userId'],
        where: { status: 'EXPIRED' },
      }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      totalUsers,
      activeSubscriptionsCount: activeSubscriptions.length,
      expiredSubscriptionsCount: expiredSubscriptions.length,
      suspendedUsers,
    };
  }
}
