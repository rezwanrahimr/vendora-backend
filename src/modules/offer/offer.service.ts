import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CreateOfferDto,
  GetOffersQueryDto,
  GetVendorOffersQueryDto,
  RedeemOfferDto,
} from './dto/offer.dto';
import { OfferStatus, Prisma } from '@prisma/client';

@Injectable()
export class OfferService {
  constructor(private readonly prisma: PrismaService) {}

  async createOffer(payload: CreateOfferDto) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: {
        userId: payload.vendorId.toString(),
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Parse and validate dates
    const validFrom = payload.validFrom
      ? new Date(payload.validFrom)
      : new Date();

    const validUntil = new Date(payload.validUntil);

    if (validUntil <= validFrom) {
      throw new BadRequestException('validUntil must be after validFrom');
    }

    // Validate maxRedemptions
    if (
      payload.maxRedemptions !== null &&
      payload.maxRedemptions !== undefined &&
      payload.maxRedemptions < 1
    ) {
      throw new BadRequestException(
        'maxRedemptions must be null or greater than 0',
      );
    }

    // Validate cooldownPeriod for reusable offers
    if (
      payload.isReusable &&
      (payload.cooldownPeriod === undefined || payload.cooldownPeriod === null)
    ) {
      throw new BadRequestException(
        'cooldownPeriod must be provided for reusable offers',
      );
    }

    // Create offer
    return await this.prisma.offer.create({
      data: {
        title: payload.title?.trim(),
        description: payload.description?.trim(),
        type: payload.type,
        vendorId: vendor.id,
        isReusable: payload.isReusable ?? false,
        maxRedemptions: payload.maxRedemptions ?? null,
        cooldownPeriod: payload.cooldownPeriod ?? null,
        validFrom,
        validUntil,
        status: 'ACTIVE',
        isDeleted: false,
      },
    });
  }

  async getOfferById(offerId: string) {
    return await this.prisma.offer.findUniqueOrThrow({
      where: { id: offerId },
      include: {
        VendorProfile: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });
  }

  async getAllOffers(query: GetOffersQueryDto) {
    const pageNumber = Number(query.page) || 1;
    const limitNumber = Number(query.limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.OfferWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (typeof query.isReusable === 'boolean')
      where.isReusable = query.isReusable;

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Run queries in parallel without transaction
    const [
      totalOffers,
      activeOffers,
      reusableOffers,
      totalRedemptions,
      offers,
      filteredCount,
    ] = await Promise.all([
      this.prisma.offer.count(),
      this.prisma.offer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.offer.count({ where: { isReusable: true } }),
      this.prisma.offer.aggregate({ _sum: { redeemedCount: true } }),
      this.prisma.offer.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { [sortBy]: sortOrder },
        include: { VendorProfile: true },
      }),
      this.prisma.offer.count({ where }),
    ]);

    return {
      stats: {
        totalOffers,
        activeOffers,
        reusableOffers,
        totalRedemptions: totalRedemptions._sum.redeemedCount ?? 0,
      },
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalItems: filteredCount,
        totalPages: Math.ceil(filteredCount / limitNumber),
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

  async getOfferForVendor(vendorId: string, query: GetVendorOffersQueryDto) {
    const { page = 1, limit = 10, search, status, type } = query;

    const filters: any = { vendorId, isDeleted: false };
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) filters.status = status;
    if (type) filters.type = type;

    const skip = (page - 1) * limit;

    const offers = await this.prisma.offer.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.offer.count({ where: filters });

    return {
      data: offers,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async updateOffer(offerId: string, data: Partial<CreateOfferDto>) {
    const existingOffer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!existingOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return await this.prisma.offer.update({
      where: { id: offerId },
      data,
    });
  }

  async deleteOffer(offerId: string) {
    const deletedOffer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!deletedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: 'DELETED', isDeleted: true },
    });
  }

  // TODO: need to test after auth guard
  async redeemOffer(payload: RedeemOfferDto) {
    const { offerId, customerEmail } = payload;

    const customer = await this.prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with email ${customerEmail} not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch offer
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        throw new NotFoundException(`Offer with ID ${offerId} not found`);
      }

      if (offer.status !== 'ACTIVE') {
        throw new BadRequestException('Offer is not active');
      }

      if (offer.isDeleted) {
        throw new BadRequestException('Offer is deleted');
      }

      if (
        offer.maxRedemptions !== null &&
        offer.redeemedCount >= offer.maxRedemptions
      ) {
        throw new BadRequestException(
          'Offer has reached its maximum redemptions',
        );
      }

      // 2️⃣ Cooldown check
      if (offer.isReusable && offer.cooldownPeriod) {
        const lastRedemption = await tx.offerRedemption.findUnique({
          where: { offerId_userId: { offerId, userId: customer.id } },
        });

        if (lastRedemption) {
          const nextAvailable = new Date(lastRedemption.lastRedeemedAt);
          nextAvailable.setDate(nextAvailable.getDate() + offer.cooldownPeriod);

          if (nextAvailable > new Date()) {
            const remainingDays = Math.ceil(
              (nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );

            throw new BadRequestException(
              `Offer is on cooldown. Try again in ${remainingDays} day(s)`,
            );
          }
        }
      }

      // 3️⃣ Upsert redemption state (cooldown tracking)
      const redemption = await tx.offerRedemption.upsert({
        where: { offerId_userId: { offerId, userId: customer.id } },
        update: { lastRedeemedAt: new Date() },
        create: { offerId, userId: customer.id },
      });

      // 4️⃣ Insert analytics event (CRITICAL)
      await tx.offerRedemptionEvent.create({
        data: {
          offerId,
          userId: customer.id,
          vendorId: offer.vendorId,
        },
      });

      // 5️⃣ Increment counter
      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { redeemedCount: { increment: 1 } },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          isReusable: true,
          maxRedemptions: true,
          cooldownPeriod: true,
          redeemedCount: true,
        },
      });

      return { redemption, offer: updatedOffer };
    });
  }

  async getQuickStatsForVendor(userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorId = vendor.id;

    const [totalActive, reusableOffers, oneTimeOffers] = await Promise.all([
      this.prisma.offer.count({
        where: { vendorId, status: 'ACTIVE', isDeleted: false },
      }),
      this.prisma.offer.count({
        where: {
          vendorId,
          status: 'ACTIVE',
          isReusable: true,
          isDeleted: false,
        },
      }),
      this.prisma.offer.count({
        where: {
          vendorId,
          status: 'ACTIVE',
          isReusable: false,
          isDeleted: false,
        },
      }),
    ]);

    return {
      totalActive,
      reusableOffers,
      oneTimeOffers,
    };
  }
}
