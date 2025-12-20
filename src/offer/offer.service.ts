import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOfferDto } from './dto/offer.dto';
import { Offer, OfferStatus } from '@prisma/client';

@Injectable()
export class OfferService {
  constructor(private readonly prisma: PrismaService) {}

  async createOffer(payload: CreateOfferDto): Promise<Offer> {
    // Business validation
    const validFrom = payload.validFrom
      ? new Date(payload.validFrom)
      : new Date();
    const validUntil = new Date(payload.validUntil);

    if (validUntil <= validFrom) {
      throw new BadRequestException('validUntil must be after validFrom');
    }

    if (
      payload.maxRedemptions !== null &&
      payload.maxRedemptions !== undefined &&
      payload.maxRedemptions < 1
    ) {
      throw new BadRequestException(
        'maxRedemptions must be null or greater than 0',
      );
    }

    // Create offer
    return await this.prisma.offer.create({
      data: {
        title: payload.title,
        description: payload.description,
        type: payload.type,
        vendorId: payload.vendorId,
        isReusable: payload.isReusable ?? false,
        maxRedemptions: payload.maxRedemptions ?? null,
        validFrom,
        validUntil,
      },
    });
  }

  async getOfferById(offerId: string) {
    return await this.prisma.offer.findUniqueOrThrow({
      where: { id: offerId },
      include: {
        vendor: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });
  }

  // TODO: pagination later search filters
  async getAllOffers() {
    const totalOffers = await this.prisma.offer.count();
    const activeOffers = await this.prisma.offer.count({
      where: {
        status: 'ACTIVE',
      },
    });
    const reusableOffers = await this.prisma.offer.count({
      where: {
        isReusable: true,
      },
    });

    const totalRedemptions = await this.prisma.offer.aggregate({
      _sum: {
        redeemedCount: true,
      },
    });

    const offers = await this.prisma.offer.findMany();

    return {
      stats: {
        totalOffers,
        activeOffers,
        reusableOffers,
        totalRedemptions: totalRedemptions._sum.redeemedCount,
      },
      offers,
    };
  }

  async updateStatus(offerId: string, status: OfferStatus) {
    return await this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });
  }
}
