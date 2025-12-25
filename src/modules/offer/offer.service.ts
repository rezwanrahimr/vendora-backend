import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CreateOfferDto,
  GetOffersQueryDto,
  GetVendorOffersQueryDto,
  RedeemOfferDto,
  UpdateOfferDto,
} from './dto/offer.dto';
import { OfferStatus, Prisma } from '@prisma/client';
import { PushNotificationService } from '../notification/push-notification.service';
import { NotificationType } from '../notification/dto';
import fs from 'fs';
import path from 'path';

@Injectable()
export class OfferService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PushNotificationService))
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async createOffer(payload: CreateOfferDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    const imageUrl = `/uploads/category/images/${file.filename}`;

    // Check if vendor exists
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: payload.vendorId.toString() },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Parse dates
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

    // Validate cooldownPeriod if reusable
    if (
      payload.isReusable &&
      (payload.cooldownPeriod === undefined || payload.cooldownPeriod === null)
    ) {
      throw new BadRequestException(
        'cooldownPeriod must be provided for reusable offers',
      );
    }

    // Create offer
    const offer = await this.prisma.offer.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        type: payload.type,
        vendorId: vendor.id,
        isReusable: payload.isReusable ?? false,
        maxRedemptions: payload.maxRedemptions ?? null,
        cooldownPeriod: payload.cooldownPeriod ?? null,
        validFrom,
        validUntil,
        status: OfferStatus.ACTIVE,
        isDeleted: false,
        thumbnail: imageUrl,
        termsAndConditions: payload.termsAndConditions?.trim(),
        estimatedValue: payload.estimatedValue ?? 0,
      },
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

    // Send push notifications to users (async, non-blocking)
    this.sendNewOfferNotifications(offer).catch((error) => {
      console.error('Failed to send new offer notifications:', error);
    });

    return offer;
  }

  /**
   * Send push notifications for new offer (runs in background)
   */
  private async sendNewOfferNotifications(offer: any) {
    try {
      // Get all active users with notification preferences
      const users = await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          role: 'USER',
        },
        include: {
          notifications: true,
        },
      });

      // Filter users who have opted in for new offer notifications and have FCM tokens
      const usersToNotify = users.filter(
        (user) =>
          user.fcmTokens &&
          user.notifications.length > 0 &&
          user.notifications[0].newOffer === true,
      );

      if (usersToNotify.length === 0) {
        console.log('No users to notify for new offer');
        return;
      }

      const vendorName =
        offer.VendorProfile?.businessName || 'a local business';
      const offerTypeLabel =
        offer.type === 'BOGO'
          ? 'BOGO'
          : offer.type === 'DISCOUNT'
            ? 'discount'
            : 'special';

      console.log(
        `Sending new offer notifications to ${usersToNotify.length} users`,
      );

      // Send notifications to each user (this will store in database)
      const result = await this.pushNotificationService.sendToMultipleUsers(
        usersToNotify.map((u) => u.id),
        {
          title: 'New Offer Available!',
          body: `Check out the new ${offerTypeLabel} offer from ${vendorName}`,
          type: NotificationType.NEW_OFFER,
          data: {
            offerId: offer.id,
            offerType: offer.type,
            screen: 'OfferDetail',
          },
        },
      );

      console.log(
        `New offer notifications sent: ${result.successCount} successful, ${result.failureCount} failed`,
      );
    } catch (error) {
      console.error('Error in sendNewOfferNotifications:', error);
    }
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
        include: { VendorProfile: { include: { user: true } } },
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

    if (!vendorId) {
      throw new BadRequestException('Vendor ID is required');
    }

    const vendor = await this.prisma.vendorProfile.findUnique({
      where: {
        id: vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const filters: any = { vendorId: vendor.id, isDeleted: false };

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
      take: Number(limit), // ensure it's a number
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.offer.count({ where: filters });

    return {
      data: offers,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async updateOffer(
    offerId: string,
    dto: UpdateOfferDto,
    file?: Express.Multer.File,
  ) {
    // 1️⃣ Ensure offer exists
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // 2️⃣ Prepare update payload (remove undefined values)
    const data: any = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );

    // 3️⃣ Handle image update (replace thumbnail)
    if (file) {
      // Delete old image if exists
      if (offer.thumbnail) {
        const oldImagePath = path.join(
          process.cwd(),
          offer.thumbnail.replace(/^\/+/, ''),
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new image path
      data.thumbnail = `/uploads/offer/images/${file.filename}`;
    }

    // 4️⃣ Date normalization
    if (data.validFrom) {
      data.validFrom = new Date(data.validFrom);
    }

    if (data.validUntil) {
      data.validUntil = new Date(data.validUntil);
    }

    // 5️⃣ Business rule: cooldown requires reusable
    if (data.cooldownPeriod !== undefined && data.isReusable === false) {
      data.cooldownPeriod = null;
    }

    // 6️⃣ Persist update
    return this.prisma.offer.update({
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

  // async redeemOffer(payload: RedeemOfferDto, userId: string) {
  //   const { offerId, customerEmail } = payload;

  //   // 1️⃣ Fetch customer
  //   const customer = await this.prisma.user.findUnique({
  //     where: { email: customerEmail },
  //   });
  //   if (!customer) throw new NotFoundException(`Customer not found`);

  //   return this.prisma.$transaction(async (tx) => {
  //     // 2️⃣ Fetch offer
  //     const offer = await tx.offer.findUnique({
  //       where: { id: offerId },
  //       include: {
  //         VendorProfile: true,
  //       },
  //     });

  //     if (!offer) throw new NotFoundException(`Offer not found`);

  //     if (offer.VendorProfile.userId !== userId)
  //       throw new BadRequestException(
  //         'Offer does not belong to you, It is owned by ' +
  //           offer.VendorProfile.businessName,
  //       );

  //     if (offer.status !== 'ACTIVE')
  //       throw new BadRequestException('Offer not active');

  //     if (offer.isDeleted) throw new BadRequestException('Offer deleted');
  //     if (offer.maxRedemptions && offer.redeemedCount >= offer.maxRedemptions)
  //       throw new BadRequestException('Offer maxed out');

  //     // 3️⃣ Check previous redemption
  //     const lastRedemption = await tx.offerRedemption.findUnique({
  //       where: { offerId_userId: { offerId, userId: customer.id } },
  //     });

  //     // ❌ For non-reusable offers, throw error if already redeemed
  //     if (!offer.isReusable && lastRedemption) {
  //       throw new BadRequestException('This offer can only be redeemed once');
  //     }

  //     // 4️⃣ Check cooldown for reusable offers
  //     if (offer.isReusable && offer.cooldownPeriod && lastRedemption) {
  //       const nextAvailable = new Date(lastRedemption.lastRedeemedAt);
  //       nextAvailable.setDate(nextAvailable.getDate() + offer.cooldownPeriod);
  //       if (nextAvailable > new Date()) {
  //         const remainingDays = Math.ceil(
  //           (nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  //         );
  //         throw new BadRequestException(
  //           `Offer on cooldown, try in ${remainingDays} day(s)`,
  //         );
  //       }
  //     }

  //     // 5️⃣ Upsert redemption (tracks lastRedeemedAt)
  //     const redemption = await tx.offerRedemption.upsert({
  //       where: { offerId_userId: { offerId, userId: customer.id } },
  //       update: { lastRedeemedAt: new Date() },
  //       create: { offerId, userId: customer.id },
  //     });

  //     // 6️⃣ Log redemption event for dashboard
  //     await tx.offerRedemptionEvent.create({
  //       data: { offerId, userId: customer.id, vendorId: offer.vendorId },
  //     });

  //     // 7️⃣ Increment redeemedCount
  //     const updatedOffer = await tx.offer.update({
  //       where: { id: offerId },
  //       data: { redeemedCount: { increment: 1 } },
  //     });

  //     return { offer: updatedOffer, redemption };
  //   });
  // }

  async redeemOffer(payload: RedeemOfferDto, vendorUserId: string) {
    const { offerId, customerEmail } = payload;

    // 1️⃣ Fetch customer
    const customer = await this.prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 2️⃣ Fetch offer + vendor ownership
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        select: {
          id: true,
          status: true,
          isDeleted: true,
          isReusable: true,
          cooldownPeriod: true,
          maxRedemptions: true,
          redeemedCount: true,
          vendorId: true,
          VendorProfile: {
            select: { userId: true },
          },
        },
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      if (offer.VendorProfile.userId !== vendorUserId) {
        // throw new BadRequestException('Offer does not belong to you');
      }

      if (offer.status !== 'ACTIVE') {
        throw new BadRequestException('Offer not active');
      }

      if (offer.isDeleted) {
        throw new BadRequestException('Offer deleted');
      }

      // 3️⃣ Fetch previous redemption
      const lastRedemption = await tx.offerRedemption.findUnique({
        where: {
          offerId_userId: {
            offerId,
            userId: customer.id,
          },
        },
      });

      // ❌ Non-reusable offer already redeemed
      if (!offer.isReusable && lastRedemption) {
        throw new BadRequestException('This offer can only be redeemed once');
      }

      // 4️⃣ Cooldown enforcement (time-based)
      if (offer.isReusable && offer.cooldownPeriod && lastRedemption) {
        const nextAvailable =
          lastRedemption.lastRedeemedAt.getTime() +
          offer.cooldownPeriod * 24 * 60 * 60 * 1000;

        if (Date.now() < nextAvailable) {
          const remainingDays = Math.ceil(
            (nextAvailable - Date.now()) / (1000 * 60 * 60 * 24),
          );

          throw new BadRequestException(
            `Offer on cooldown, try in ${remainingDays} day(s)`,
          );
        }
      }

      // 5️⃣ Atomic maxRedemptions check + increment
      const increment = await tx.offer.updateMany({
        where: {
          id: offerId,
          ...(offer.maxRedemptions
            ? { redeemedCount: { lt: offer.maxRedemptions } }
            : {}),
        },
        data: {
          redeemedCount: { increment: 1 },
        },
      });

      if (increment.count === 0) {
        throw new BadRequestException('Offer maxed out');
      }

      // 6️⃣ Upsert redemption record
      const redemption = await tx.offerRedemption.upsert({
        where: {
          offerId_userId: {
            offerId,
            userId: customer.id,
          },
        },
        update: {
          lastRedeemedAt: new Date(),
        },
        create: {
          offerId,
          userId: customer.id,
        },
      });

      // 7️⃣ Log redemption event
      await tx.offerRedemptionEvent.create({
        data: {
          offerId,
          userId: customer.id,
          vendorId: offer.vendorId,
        },
      });

      // 8️⃣ Return minimal response
      return {
        offer,
        redemption,
      };
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

  async getNewestOffers(categoryId?: string, limit = 5) {
    return this.prisma.offer.findMany({
      where: {
        isDeleted: false,
        ...(categoryId && {
          VendorProfile: {
            categoryId,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        VendorProfile: {
          include: {
            user: {
              omit: { password: true },
            },
          },
        },
      },
    });
  }

  async getTrendingOffers(categoryId?: string, limit = 5) {
    const since = new Date();
    since.setDate(since.getDate() - 7); // last 7 days

    return this.prisma.offer.findMany({
      where: {
        isDeleted: false,
        ...(categoryId && {
          VendorProfile: {
            categoryId,
          },
        }),
        offerRedemptionEvents: {
          some: {
            redeemedAt: { gte: since },
          },
        },
      },
      orderBy: {
        offerRedemptionEvents: {
          _count: 'desc',
        },
      },
      take: Number(limit),
      include: {
        VendorProfile: {
          include: {
            user: {
              omit: { password: true },
            },
          },
        },
      },
    });
  }

  async getMyRedeemedOffersWithSavings(userId: string) {
    // 1️⃣ Fetch all offer redemptions for the user with related offer and vendor info
    const redemptions = await this.prisma.offerRedemption.findMany({
      where: { userId },
      include: {
        Offer: {
          select: {
            title: true,
            thumbnail: true,
            estimatedValue: true,
            VendorProfile: {
              select: {
                businessName: true,
                city: true,
                streetAddress: true,
              },
            },
          },
        },
      },
    });

    // 2️⃣ Calculate total savings per offer
    const result = redemptions.map((r) => ({
      offerId: r.offerId,
      title: r.Offer.title,
      vendorName: r.Offer.VendorProfile.businessName,
      image: r.Offer.thumbnail,
      savedAmount: r.Offer.estimatedValue,
      lastRedeemedAt: r.lastRedeemedAt,
      vendorAddress: `${r.Offer.VendorProfile.streetAddress}, ${r.Offer.VendorProfile.city}`,
    }));

    // 3️⃣ Calculate total savings across all redemptions
    const totalSaving = result.reduce((sum, r) => sum + r.savedAmount, 0);

    return {
      totalSaving,
      redeemedOffers: result,
    };
  }
}
