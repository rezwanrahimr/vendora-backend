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
        id: id.toString(),
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

  async updateVendorProfile(
    userId: number,
    data: {
      businessName?: string;
      businessAddress?: string;
      phoneNumber?: string;
      taxId?: string;
      description?: string;
    },
  ) {
    const vendor = await this.prisma.user.findFirst({
      where: { id: userId.toString(), role: 'VENDOR' },
      include: { vendorProfile: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendorProfile.update({
      where: { userId: userId.toString() },
      data,
    });
  }

  async verifyVendor(userId: number) {
    const vendor = await this.prisma.user.findFirst({
      where: { id: userId.toString(), role: 'VENDOR' },
      include: { vendorProfile: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendorProfile.update({
      where: { userId: userId.toString() },
      data: { isVerified: true },
    });
  }

  async getVendorDashboard(
    userId: string,
    options?: { from?: Date; to?: Date }, // optional timeframe
  ) {
    // 1️⃣ Fetch vendor
    const vendor = await this.prisma.user.findFirst({
      where: { id: userId, role: 'VENDOR' },
      include: { vendorProfile: true },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    const fromDate =
      options?.from ?? new Date(new Date().setDate(new Date().getDate() - 30)); // default last 30 days
    const toDate = options?.to ?? new Date();

    // 2️⃣ Aggregate main stats in a transaction
    const [
      totalOffers,
      activeOffers,
      reusableOffers,
      oneTimeOffers,
      totalRedemptions,
      dailyRedemptionsRaw,
    ] = await this.prisma.$transaction([
      this.prisma.offer.count({ where: { vendorId: vendor.id } }),
      this.prisma.offer.count({
        where: { vendorId: vendor.id, status: 'ACTIVE' },
      }),
      this.prisma.offer.count({
        where: { vendorId: vendor.id, isReusable: true },
      }),
      this.prisma.offer.count({
        where: { vendorId: vendor.id, isReusable: false },
      }),
      this.prisma.offerRedemptionEvent.count({
        where: {
          vendorId: vendor.id,
          redeemedAt: { gte: fromDate, lte: toDate },
        },
      }),
      // 3️⃣ Daily redemptions for given timeframe
      this.prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT
        TO_CHAR("redeemedAt", 'YYYY-MM-DD') AS date,
        COUNT(*) AS count
      FROM "OfferRedemptionEvent"
      WHERE "vendorId" = ${vendor.id}
        AND "redeemedAt" BETWEEN ${fromDate} AND ${toDate}
      GROUP BY TO_CHAR("redeemedAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `,
    ]);

    // 4️⃣ Calculate average redemptions
    const averageRedemptions =
      totalOffers > 0 ? totalRedemptions / totalOffers : 0;

    return {
      stats: {
        totalOffers,
        activeOffers,
        reusableOffers,
        oneTimeOffers,
        totalRedemptions,
        averageRedemptions: Number(averageRedemptions.toFixed(2)),
      },
      charts: {
        dailyRedemptions: dailyRedemptionsRaw, // already [{date, count}]
      },
    };
  }

  async getOffersUsageHistory(userId: string) {
    // 1️⃣ Redemptions by Offer (bar chart)
    const redemptionsByOfferRaw =
      await this.prisma.offerRedemptionEvent.groupBy({
        by: ['offerId'],
        where: { vendorId: userId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

    const offerIds = redemptionsByOfferRaw.map((r) => r.offerId as string);
    const offers = await this.prisma.offer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, title: true, redeemedCount: true, updatedAt: true },
    });

    const offerMap = new Map(offers.map((o) => [o.id, o]));
    const redemptionsByOffer = redemptionsByOfferRaw.map((r) => {
      const offer = offerMap.get(r.offerId)!;
      return {
        offerId: r.offerId,
        title: offer?.title ?? 'Unknown',
        count: r._count.id,
      };
    });

    // 2️⃣ Top Performing Offers (pie chart) - top 10
    const topPerformingOffers = redemptionsByOffer.slice(0, 10);

    // 3️⃣ Redemptions by Day of Week (bar chart)
    const redemptionsByWeekdayRaw = await this.prisma.$queryRaw<
      { weekday: number; count: number }[]
    >`
    SELECT EXTRACT(DOW FROM "redeemedAt") AS weekday, COUNT(*) AS count
    FROM "OfferRedemptionEvent"
    WHERE "vendorId" = ${userId}
    GROUP BY weekday
    ORDER BY weekday
  `;

    const weekdayLabels = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const redemptionsByWeekday = weekdayLabels.map((day, i) => ({
      weekday: day,
      count: redemptionsByWeekdayRaw.find((r) => r.weekday === i)?.count ?? 0,
    }));

    // 4️⃣ Redemptions by Hour (line chart)
    const redemptionsByHourRaw = await this.prisma.$queryRaw<
      { hour: number; count: number }[]
    >`
    SELECT EXTRACT(HOUR FROM "redeemedAt") AS hour, COUNT(*) AS count
    FROM "OfferRedemptionEvent"
    WHERE "vendorId" = ${userId}
    GROUP BY hour
    ORDER BY hour
  `;

    const redemptionsByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: redemptionsByHourRaw.find((r) => r.hour === i)?.count ?? 0,
    }));

    // 5️⃣ Offer performance analysis
    const offerPerformanceAnalysis = offers.map((offer) => {
      let performance: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
      if (offer.redeemedCount < 20) performance = 'LOW';
      else if (offer.redeemedCount >= 20 && offer.redeemedCount <= 50)
        performance = 'MEDIUM';

      return {
        offerId: offer.id,
        title: offer.title,
        redeemedCount: offer.redeemedCount,
        lastRedeemedAt: offer.updatedAt,
        performance,
      };
    });

    return {
      charts: {
        redemptionsByOffer,
        topPerformingOffers,
        redemptionsByWeekday,
        redemptionsByHour,
      },
      offerPerformanceAnalysis,
    };
  }
}
