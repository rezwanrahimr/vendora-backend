import { Injectable } from '@nestjs/common';
import { OfferType } from '@prisma/client';
import { format, getMonth } from 'date-fns';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async adminRedeemedOfferStats() {
    const [totalOffers, totalActiveOffers, totalRedemptions] =
      await Promise.all([
        this.prisma.offer.count({
          where: { isDeleted: false },
        }),

        this.prisma.offer.count({
          where: { isDeleted: false, status: 'ACTIVE' },
        }),

        this.prisma.offerRedemption.count(),
      ]);

    const avgRedemptionsPerOffer =
      totalOffers > 0 ? totalRedemptions / totalOffers : 0;

    return {
      totalOffers,
      totalActiveOffers,
      totalRedemptions,
      avgRedemptionsPerOffer: Number(avgRedemptionsPerOffer.toFixed(2)),
    };
  }

  async offerTypeDistribution() {
    const data = await this.prisma.offer.groupBy({
      by: ['type'],
      where: { isDeleted: false },
      _count: {
        _all: true,
      },
    });

    const map = new Map(data.map((d) => [d.type, d._count._all]));

    const types: OfferType[] = ['BOGO', 'DISCOUNT', 'SPECIAL'];

    const total = types.reduce((sum, t) => sum + (map.get(t) || 0), 0);

    return types.map((type) => {
      const count = map.get(type) || 0;

      return {
        label: type,
        count,
        value: total ? Number(((count / total) * 100).toFixed(2)) : 0,
      };
    });
  }
}
