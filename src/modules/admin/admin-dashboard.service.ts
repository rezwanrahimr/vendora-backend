import { Injectable } from '@nestjs/common';
import { format, getMonth } from 'date-fns';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async dashboardStatus() {
    const now = new Date();

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const endOfPreviousMonth = startOfCurrentMonth;

    const [
      totalVendors,
      totalUsers,
      activeOffers,
      redeemedOffers,

      // current month revenue
      currentMonthRevenue,

      // previous month revenue
      previousMonthRevenue,

      // total revenue till now
      totalRevenue,

      // total revenue till last month
      totalRevenueTillLastMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'VENDOR' } }),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.offer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.offerRedemptionEvent.count(),

      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfCurrentMonth },
        },
      }),

      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startOfPreviousMonth,
            lt: endOfPreviousMonth,
          },
        },
      }),

      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
        },
      }),

      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: {
            lt: startOfCurrentMonth,
          },
        },
      }),
    ]);

    // ✅ Convert Decimal → number
    const current = Number(currentMonthRevenue._sum.amount ?? 0);
    const previous = Number(previousMonthRevenue._sum.amount ?? 0);

    const total = Number(totalRevenue._sum.amount ?? 0);
    const totalTillLastMonth = Number(
      totalRevenueTillLastMonth._sum.amount ?? 0,
    );

    // =========================
    // 📈 1. Monthly revenue growth
    // =========================
    const monthlyRevenueGrowth =
      previous > 0 ? ((current - previous) / previous) * 100 : 0;

    // =========================
    // 📊 2. Total revenue growth (MoM cumulative growth)
    // =========================
    const totalRevenueGrowth =
      totalTillLastMonth > 0
        ? ((total - totalTillLastMonth) / totalTillLastMonth) * 100
        : 0;

    return {
      totalVendors,
      totalUsers,
      activeOffers,
      redeemedOffers,

      monthlyRevenue: {
        currentMonthRevenue: current,
        previousMonthRevenue: previous,
        growthPercentage: monthlyRevenueGrowth,
      },

      totalRevenue: {
        currentTotalRevenue: total,
        previousTotalRevenue: totalTillLastMonth,
        growthPercentage: totalRevenueGrowth,
      },
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

  async offerRedeemChart(year?: number) {
    const currentYear = year ?? new Date().getFullYear();

    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear + 1, 0, 1);

    // 1️⃣ Fetch only needed field
    const events = await this.prisma.offerRedemptionEvent.findMany({
      where: {
        redeemedAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        redeemedAt: true,
      },
    });

    // 2️⃣ Initialize months using date-fns
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);

      return {
        month: i + 1,
        monthName: format(date, 'MMMM'), // 👈 date-fns
        totalRedemptions: 0,
      };
    });

    // 3️⃣ Group using date-fns getMonth
    for (const event of events) {
      const monthIndex = getMonth(event.redeemedAt); // 0-11
      chartData[monthIndex].totalRedemptions += 1;
    }

    return chartData;
  }

  async getTopPerformingVendors() {
    // 1️⃣ Aggregate offers
    const vendorsAgg = await this.prisma.offer.groupBy({
      by: ['vendorId'],
      _count: { _all: true },
      _sum: { redeemedCount: true },
      orderBy: { _sum: { redeemedCount: 'desc' } },
      take: 5,
    });

    const vendorIds = vendorsAgg.map((v) => v.vendorId);

    // 2️⃣ Fetch all vendors in ONE query
    const vendors = await this.prisma.vendorProfile.findMany({
      where: {
        id: { in: vendorIds },
      },
      select: {
        id: true,
        businessName: true,
      },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v.businessName]));

    // 3️⃣ Transform result
    return vendorsAgg.map((v) => {
      const totalOffers = v._count._all;
      const totalRedeemed = v._sum.redeemedCount ?? 0;

      const redemptionRate =
        totalOffers > 0 ? Math.round((totalRedeemed / totalOffers) * 100) : 0;

      return {
        vendorId: v.vendorId,
        vendorName: vendorMap.get(v.vendorId) || 'Unknown',
        totalOffers,
        totalRedeemed,
        redemptionRate,
      };
    });
  }

  async revenueOverviewChart(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear + 1, 0, 1);

    // 1️⃣ Fetch payments in range
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // 2️⃣ Aggregate by month (using date-fns format)
    const monthlyMap = new Map<string, number>();

    for (const payment of payments) {
      const monthKey = format(payment.createdAt, 'MMM'); // Jan, Feb, Mar...

      const amount = Number(payment.amount);

      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount);
    }

    // 3️⃣ Ensure all months exist in order
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const chartData = months.map((month) => ({
      month,
      revenue: monthlyMap.get(month) || 0,
    }));

    // 4️⃣ Return response
    return {
      year: targetYear,
      data: chartData,
    };
  }
}
