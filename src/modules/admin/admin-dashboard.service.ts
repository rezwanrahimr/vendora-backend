import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import {
  endOfMonth,
  endOfYear,
  format,
  getMonth,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import { Parser } from 'json2csv';
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

    const startDate = startOfYear(new Date(targetYear, 0, 1));
    const endDate = endOfYear(new Date(targetYear, 0, 1));

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // 1️⃣ fixed 12-month array
    const monthlyRevenue = Array(12).fill(0);

    for (const payment of payments) {
      const monthIndex = getMonth(payment.createdAt); // 0–11
      monthlyRevenue[monthIndex] += Number(payment.amount);
    }

    const chartData = monthlyRevenue.map((revenue, index) => ({
      month: months[index],
      revenue,
    }));

    return {
      year: targetYear,
      data: chartData,
    };
  }

  async exportRevenueOverviewToCsv(year?: number) {
    const data = await this.revenueOverviewChart(year);

    const parser = new Parser({
      fields: [
        { label: 'Month', value: 'month' },
        { label: 'Revenue', value: 'revenue' },
      ],
    });

    const csv = parser.parse(data.data);

    return '\uFEFFRevenue Overview\n\n' + csv;
  }

  private toNumber(value: number | Decimal | null | undefined): number {
    if (!value) return 0;
    return value instanceof Decimal ? value.toNumber() : value;
  }

  async getReportsAnalyticsData() {
    const now = new Date();

    // Date ranges
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // 1️⃣ All-time revenue
    const totalRevenueResult = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
    });

    // 2️⃣ Revenue till last month (cumulative baseline)
    const tillLastMonthResult = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        createdAt: {
          lte: lastMonthEnd,
        },
      },
    });

    // 3️⃣ Current month revenue
    const currentMonthResult = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    // 4️⃣ Last month revenue
    const lastMonthResult = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    // Normalize values
    const totalRevenue = this.toNumber(totalRevenueResult._sum.amount);
    const tillLastMonth = this.toNumber(tillLastMonthResult._sum.amount);
    const currentMonth = this.toNumber(currentMonthResult._sum.amount);
    const lastMonth = this.toNumber(lastMonthResult._sum.amount);

    // 5️⃣ Total growth (vs all previous months)
    let totalGrowthRate = 0;
    if (tillLastMonth > 0) {
      totalGrowthRate = ((totalRevenue - tillLastMonth) / tillLastMonth) * 100;
    } else if (totalRevenue > 0) {
      totalGrowthRate = 100;
    }

    // 6️⃣ Month-over-month growth
    let monthlyGrowthRate = 0;
    if (lastMonth > 0) {
      monthlyGrowthRate = ((currentMonth - lastMonth) / lastMonth) * 100;
    } else if (currentMonth > 0) {
      monthlyGrowthRate = 100;
    }

    return {
      totalRevenue,
      currentMonthRevenue: currentMonth,
      lastMonthRevenue: lastMonth,

      totalGrowthRate,
      monthlyGrowthRate,
    };
  }

  async revenueBreakDownByMonth(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const monthLabels = [
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

    // 1️⃣ Year boundaries (date-fns)
    const startDate = startOfYear(new Date(targetYear, 0, 1));
    const endDate = endOfYear(new Date(targetYear, 0, 1));

    // 2️⃣ Fetch payments
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // 3️⃣ Initialize all months
    const monthlyTotals = Array(12).fill(0);

    // 4️⃣ Aggregate
    for (const payment of payments) {
      const date =
        payment.createdAt instanceof Date
          ? payment.createdAt
          : parseISO(payment.createdAt as unknown as string);

      const monthIndex = getMonth(date); // 0–11

      monthlyTotals[monthIndex] += this.toNumber(payment.amount);
    }

    // 5️⃣ Format response
    return monthlyTotals.map((amount, index) => ({
      month: monthLabels[index],
      amount,
    }));
  }
}
