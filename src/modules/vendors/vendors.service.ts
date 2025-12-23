import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { getDay, getHours } from 'date-fns';

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

  async findOne(id: string) {
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

  // async getVendorDashboard(
  //   userId: string,
  //   options?: { from?: Date; to?: Date }, // optional timeframe
  // ) {
  //   // 1️⃣ Fetch vendor
  //   const vendor = await this.prisma.user.findFirst({
  //     where: { id: userId, role: 'VENDOR' },
  //     include: { vendorProfile: true },
  //   });

  //   if (!vendor) throw new NotFoundException('Vendor not found');

  //   const fromDate =
  //     options?.from ?? new Date(new Date().setDate(new Date().getDate() - 30)); // default last 30 days
  //   const toDate = options?.to ?? new Date();

  //   // 2️⃣ Aggregate main stats in a transaction
  //   const [
  //     totalOffers,
  //     activeOffers,
  //     reusableOffers,
  //     oneTimeOffers,
  //     totalRedemptions,
  //     dailyRedemptionsRaw,
  //   ] = await this.prisma.$transaction([
  //     this.prisma.offer.count({ where: { vendorId: vendor.id } }),
  //     this.prisma.offer.count({
  //       where: { vendorId: vendor.id, status: 'ACTIVE' },
  //     }),
  //     this.prisma.offer.count({
  //       where: { vendorId: vendor.id, isReusable: true },
  //     }),
  //     this.prisma.offer.count({
  //       where: { vendorId: vendor.id, isReusable: false },
  //     }),
  //     this.prisma.offerRedemptionEvent.count({
  //       where: {
  //         vendorId: vendor.id,
  //         redeemedAt: { gte: fromDate, lte: toDate },
  //       },
  //     }),
  //     // 3️⃣ Daily redemptions for given timeframe
  //     this.prisma.$queryRaw<{ date: string; count: number }[]>`
  //     SELECT
  //       TO_CHAR("redeemedAt", 'YYYY-MM-DD') AS date,
  //       COUNT(*) AS count
  //     FROM "OfferRedemptionEvent"
  //     WHERE "vendorId" = ${vendor.id}
  //       AND "redeemedAt" BETWEEN ${fromDate} AND ${toDate}
  //     GROUP BY TO_CHAR("redeemedAt", 'YYYY-MM-DD')
  //     ORDER BY date ASC
  //   `,
  //   ]);

  //   // 4️⃣ Calculate average redemptions
  //   const averageRedemptions =
  //     totalOffers > 0 ? totalRedemptions / totalOffers : 0;

  //   return {
  //     stats: {
  //       totalOffers,
  //       activeOffers,
  //       reusableOffers,
  //       oneTimeOffers,
  //       totalRedemptions,
  //       averageRedemptions: Number(averageRedemptions.toFixed(2)),
  //     },
  //     charts: {
  //       dailyRedemptions: dailyRedemptionsRaw, // already [{date, count}]
  //     },
  //   };
  // }

  // TODO: export to csv,

  async getVendorDashboard(
    userId: string,
    options?: { from?: Date; to?: Date },
  ) {
    // 1️⃣ Fetch vendor
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { userId: userId.toString() },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // 2️⃣ Normalize dates to UTC
    const fromDate =
      options?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = options?.to ?? new Date();

    const fromDateUTC = new Date(
      Date.UTC(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate(),
        0,
        0,
        0,
      ),
    );
    const toDateUTC = new Date(
      Date.UTC(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate(),
        23,
        59,
        59,
      ),
    );

    // 3️⃣ Fetch offers
    const offers = await this.prisma.offer.findMany({
      where: { vendorId: vendor.id },
      select: {
        id: true,
        title: true,
        status: true,
        isReusable: true,
        updatedAt: true,
      },
    });

    const offerIds = offers.map((o) => o.id);

    // 4️⃣ Fetch redemptions per offer
    const redemptionGroups = await this.prisma.offerRedemptionEvent.groupBy({
      by: ['offerId'],
      where: {
        offerId: { in: offerIds },
        vendorId: vendor.id,
        redeemedAt: { gte: fromDateUTC, lte: toDateUTC },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const redemptionMap = new Map(
      redemptionGroups.map((r) => [r.offerId, r._count.id ?? 0]),
    );

    // 5️⃣ Daily redemptions
    const dailyRaw = await this.prisma.$queryRaw<
      { date: string; count: string }[]
    >`
    SELECT TO_CHAR("redeemedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
           COUNT(*) AS count
    FROM "OfferRedemptionEvent"
    WHERE "vendorId" = ${vendor.id}
      AND "redeemedAt" BETWEEN ${fromDateUTC} AND ${toDateUTC}
    GROUP BY date
    ORDER BY date ASC
  `;
    const dailyRedemptions = dailyRaw.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));

    // 6️⃣ Redemptions by offer
    const redemptionsByOffer = offers.map((o) => ({
      offerId: o.id,
      title: o.title,
      count: redemptionMap.get(o.id) ?? 0,
    }));

    const topPerformingOffers = redemptionsByOffer
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7️⃣ Offer performance analysis
    const offerPerformanceAnalysis = offers.map((o) => {
      const count = redemptionMap.get(o.id) ?? 0;
      let performance: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
      if (count < 20) performance = 'LOW';
      else if (count <= 50) performance = 'MEDIUM';

      return {
        offerId: o.id,
        title: o.title,
        redeemedCount: count,
        lastRedeemedAt: o.updatedAt,
        performance,
      };
    });

    // 8️⃣ Stats
    const totalOffers = offers.length;
    const totalRedemptions = Array.from(redemptionMap.values()).reduce(
      (sum, v) => sum + v,
      0,
    );

    return {
      stats: {
        totalOffers,
        activeOffers: offers.filter((o) => o.status === 'ACTIVE').length,
        reusableOffers: offers.filter((o) => o.isReusable).length,
        oneTimeOffers: offers.filter((o) => !o.isReusable).length,
        totalRedemptions,
        averageRedemptions: totalOffers
          ? Number((totalRedemptions / totalOffers).toFixed(2))
          : 0,
      },
      charts: {
        dailyRedemptions,
        redemptionsByOffer,
        topPerformingOffers,
      },
      offerPerformanceAnalysis,
    };
  }

  // async getOffersUsageHistory(userId: string) {
  //   // 1️⃣ Redemptions by Offer (bar chart)
  //   const redemptionsByOfferRaw =
  //     await this.prisma.offerRedemptionEvent.groupBy({
  //       by: ['offerId'],
  //       where: { vendorId: userId },
  //       _count: { id: true },
  //       orderBy: { _count: { id: 'desc' } },
  //     });

  //   const offerIds = redemptionsByOfferRaw.map((r) => r.offerId);
  //   const offers = await this.prisma.offer.findMany({
  //     where: { id: { in: offerIds } },
  //     select: { id: true, title: true, redeemedCount: true, updatedAt: true },
  //   });

  //   const offerMap = new Map(offers.map((o) => [o.id, o]));
  //   const redemptionsByOffer = redemptionsByOfferRaw.map((r) => {
  //     const offer = offerMap.get(r.offerId)!;
  //     return {
  //       offerId: r.offerId,
  //       title: offer?.title ?? 'Unknown',
  //       count: r._count.id,
  //     };
  //   });

  //   // 2️⃣ Top Performing Offers (pie chart) - top 10
  //   const topPerformingOffers = redemptionsByOffer.slice(0, 10);

  //   // 3️⃣ Redemptions by Day of Week (bar chart)
  //   const redemptionsByWeekdayRaw = await this.prisma.$queryRaw<
  //     { weekday: number; count: number }[]
  //   >`
  //   SELECT EXTRACT(DOW FROM "redeemedAt") AS weekday, COUNT(*) AS count
  //   FROM "OfferRedemptionEvent"
  //   WHERE "vendorId" = ${userId}
  //   GROUP BY weekday
  //   ORDER BY weekday
  // `;

  //   const weekdayLabels = [
  //     'Sunday',
  //     'Monday',
  //     'Tuesday',
  //     'Wednesday',
  //     'Thursday',
  //     'Friday',
  //     'Saturday',
  //   ];
  //   const redemptionsByWeekday = weekdayLabels.map((day, i) => ({
  //     weekday: day,
  //     count: redemptionsByWeekdayRaw.find((r) => r.weekday === i)?.count ?? 0,
  //   }));

  //   // 4️⃣ Redemptions by Hour (line chart)
  //   const redemptionsByHourRaw = await this.prisma.$queryRaw<
  //     { hour: number; count: number }[]
  //   >`
  //   SELECT EXTRACT(HOUR FROM "redeemedAt") AS hour, COUNT(*) AS count
  //   FROM "OfferRedemptionEvent"
  //   WHERE "vendorId" = ${userId}
  //   GROUP BY hour
  //   ORDER BY hour
  // `;

  //   const redemptionsByHour = Array.from({ length: 24 }, (_, i) => ({
  //     hour: i,
  //     count: redemptionsByHourRaw.find((r) => r.hour === i)?.count ?? 0,
  //   }));

  //   // 5️⃣ Offer performance analysis
  //   const offerPerformanceAnalysis = offers.map((offer) => {
  //     let performance: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
  //     if (offer.redeemedCount < 20) performance = 'LOW';
  //     else if (offer.redeemedCount >= 20 && offer.redeemedCount <= 50)
  //       performance = 'MEDIUM';

  //     return {
  //       offerId: offer.id,
  //       title: offer.title,
  //       redeemedCount: offer.redeemedCount,
  //       lastRedeemedAt: offer.updatedAt,
  //       performance,
  //     };
  //   });

  //   return {
  //     charts: {
  //       redemptionsByOffer,
  //       topPerformingOffers,
  //       redemptionsByWeekday,
  //       redemptionsByHour,
  //     },
  //     offerPerformanceAnalysis,
  //   };
  // }

  //   async getOffersUsageHistory(userId: string) {
  //     const vendor = await this.prisma.vendorProfile.findFirstOrThrow({
  //       where: { userId },
  //     });

  //     if (!vendor) throw new NotFoundException('Vendor not found');
  //     // 1️⃣ Fetch all redemption events for vendor
  //     const redemptionGroups = await this.prisma.offerRedemptionEvent.groupBy({
  //       by: ['offerId'],
  //       where: { vendorId: vendor.id },
  //       _count: { id: true },
  //       orderBy: { _count: { id: 'desc' } },
  //     });

  //     const offerIds = redemptionGroups.map((r) => r.offerId);
  //     const offers = await this.prisma.offer.findMany({
  //       where: { id: { in: offerIds } },
  //       select: { id: true, title: true, updatedAt: true },
  //     });

  //     const offerMap = new Map(offers.map((o) => [o.id, o]));

  //     // 2️⃣ Redemptions by offer
  //     const redemptionsByOffer = redemptionGroups.map((r) => ({
  //       offerId: r.offerId,
  //       title: offerMap.get(r.offerId)?.title ?? 'Unknown',
  //       count: r._count.id ?? 0,
  //     }));

  //     const topPerformingOffers = redemptionsByOffer
  //       .sort((a, b) => b.count - a.count)
  //       .slice(0, 10);

  //     // TODO: weekday and hour not working
  //     // 3️⃣ Redemptions by weekday
  //     // const redemptionsByWeekdayRaw = await this.prisma.$queryRaw<
  //     //   { weekday: number; count: string }[]
  //     // >`
  //     //   SELECT EXTRACT(DOW FROM "redeemedAt" AT TIME ZONE 'UTC') AS weekday,
  //     //          COUNT(*) AS count
  //     //   FROM "OfferRedemptionEvent"
  //     //   WHERE "vendorId" = ${vendor.id}
  //     //   GROUP BY weekday
  //     //   ORDER BY weekday
  //     // `;

  // const redemptionsByWeekdayRaw = await this.prisma.$queryRaw<
  //   { weekday: number; count: string }[]
  // >`
  //   SELECT EXTRACT(DOW FROM "redeemedAt" AT TIME ZONE 'UTC') AS weekday,
  //          COUNT(*) AS count
  //   FROM "OfferRedemptionEvent"
  //   WHERE "vendorId" = ${vendor.id}
  //   GROUP BY weekday
  //   ORDER BY weekday;
  // `;

  //     const weekdayLabels = [
  //       'Sunday',
  //       'Monday',
  //       'Tuesday',
  //       'Wednesday',
  //       'Thursday',
  //       'Friday',
  //       'Saturday',
  //     ];
  //     const redemptionsByWeekday = weekdayLabels.map((day, i) => ({
  //       weekday: day,
  //       count: Number(
  //         redemptionsByWeekdayRaw.find((r) => r.weekday === i)?.count ?? 0,
  //       ),
  //     }));

  //     // 4️⃣ Redemptions by hour
  //     // const redemptionsByHourRaw = await this.prisma.$queryRaw<
  //     //   { hour: number; count: string }[]
  //     // >`
  //     //   SELECT EXTRACT(HOUR FROM "redeemedAt" AT TIME ZONE 'UTC') AS hour,
  //     //          COUNT(*) AS count
  //     //   FROM "OfferRedemptionEvent"
  //     //   WHERE "vendorId" = ${vendor.id}
  //     //   GROUP BY hour
  //     //   ORDER BY hour
  //     // `;

  // const redemptionsByHourRaw = await this.prisma.$queryRaw<
  //   { hour: number; count: string }[]
  // >`
  //   SELECT EXTRACT(HOUR FROM "redeemedAt" AT TIME ZONE 'UTC') AS hour,
  //          COUNT(*) AS count
  //   FROM "OfferRedemptionEvent"
  //   WHERE "vendorId" = ${vendor.id}
  //   GROUP BY hour
  //   ORDER BY hour;
  // `;

  //     const redemptionsByHour = Array.from({ length: 24 }, (_, i) => ({
  //       hour: i,
  //       count: Number(redemptionsByHourRaw.find((r) => r.hour === i)?.count ?? 0),
  //     }));

  //     // 5️⃣ Offer performance analysis
  //     const offerPerformanceAnalysis = offers.map((o) => {
  //       const count =
  //         redemptionGroups.find((r) => r.offerId === o.id)?._count.id ?? 0;
  //       let performance: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
  //       if (count < 20) performance = 'LOW';
  //       else if (count <= 50) performance = 'MEDIUM';

  //       return {
  //         offerId: o.id,
  //         title: o.title,
  //         redeemedCount: count,
  //         lastRedeemedAt: o.updatedAt,
  //         performance,
  //       };
  //     });

  //     return {
  //       charts: {
  //         redemptionsByOffer,
  //         topPerformingOffers,
  //         redemptionsByWeekday,
  //         redemptionsByHour,
  //       },
  //       offerPerformanceAnalysis,
  //     };
  //   }

  async getOffersUsageHistory(userId: string) {
    const vendor = await this.prisma.vendorProfile.findFirstOrThrow({
      where: { userId },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    // 1️⃣ Fetch all redemption events for vendor
    const redemptionGroups = await this.prisma.offerRedemptionEvent.groupBy({
      by: ['offerId'],
      where: { vendorId: vendor.id },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const offerIds = redemptionGroups.map((r) => r.offerId);
    const offers = await this.prisma.offer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, title: true, updatedAt: true },
    });

    const offerMap = new Map(offers.map((o) => [o.id, o]));

    // 2️⃣ Redemptions by offer
    const redemptionsByOffer = redemptionGroups.map((r) => ({
      offerId: r.offerId,
      title: offerMap.get(r.offerId)?.title ?? 'Unknown',
      count: r._count.id ?? 0,
    }));

    const topPerformingOffers = redemptionsByOffer
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3️⃣ Fetch all redemption events for JS-based charts
    const events = await this.prisma.offerRedemptionEvent.findMany({
      where: { vendorId: vendor.id },
      select: { redeemedAt: true },
    });

    // 4️⃣ Redemptions by weekday using date-fns
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
      count: events.filter((e) => getDay(e.redeemedAt) === i).length,
    }));

    // 5️⃣ Redemptions by hour using date-fns
    const redemptionsByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: events.filter((e) => getHours(e.redeemedAt) === i).length,
    }));

    // 6️⃣ Offer performance analysis
    const offerPerformanceAnalysis = offers.map((o) => {
      const count =
        redemptionGroups.find((r) => r.offerId === o.id)?._count.id ?? 0;
      let performance: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
      if (count < 20) performance = 'LOW';
      else if (count <= 50) performance = 'MEDIUM';

      return {
        offerId: o.id,
        title: o.title,
        redeemedCount: count,
        lastRedeemedAt: o.updatedAt,
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

  async exportToCsv(userId: string) {
    const data = await this.getOffersUsageHistory(userId);

    const sections: string[] = [];

    // 1️⃣ Redemptions by Offer
    sections.push('Redemptions by Offer');
    sections.push('Offer,Redemptions');
    data.charts.redemptionsByOffer.forEach((r) => {
      sections.push(`${escapeCsv(r.title)},${r.count}`);
    });
    sections.push(''); // empty line

    // 2️⃣ Top Performing Offers
    sections.push('Top Performing Offers');
    sections.push('Offer,Redemptions');
    data.charts.topPerformingOffers.forEach((r) => {
      sections.push(`${escapeCsv(r.title)},${r.count}`);
    });
    sections.push('');

    // 3️⃣ Redemptions by Day of Week
    sections.push('Redemptions by Day of Week');
    sections.push('Weekday,Redemptions');
    data.charts.redemptionsByWeekday.forEach((r) => {
      sections.push(`${escapeCsv(r.weekday)},${r.count}`);
    });
    sections.push('');

    // 4️⃣ Redemptions by Hour
    sections.push('Redemptions by Hour');
    sections.push('Hour,Redemptions');
    data.charts.redemptionsByHour.forEach((r) => {
      sections.push(`${r.hour},${r.count}`);
    });
    sections.push('');

    function escapeCsv(value: string): string {
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }

    // 5️⃣ Offer Performance Analysis
    sections.push('Offer Performance Analysis');
    sections.push('Offer,Redeemed Count,Last Redeemed At,Performance');
    data.offerPerformanceAnalysis.forEach((r) => {
      sections.push(
        `${escapeCsv(r.title)},${r.redeemedCount},${r.lastRedeemedAt.toISOString()},${r.performance}`,
      );
    });

    return sections.join('\n');
  }
}
