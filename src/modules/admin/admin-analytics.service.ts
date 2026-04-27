import { Injectable } from '@nestjs/common';
import { OfferType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

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
