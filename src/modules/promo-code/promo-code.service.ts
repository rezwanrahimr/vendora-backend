import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';
import { Prisma, PromoCodeStatus } from '@prisma/client';

@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async createPromoCode(payload: CreatePromoCodeDto) {
    const { code, type, discountPercentage, maxUsages, expiryDate } = payload;

    // 1. Normalize
    const normalizedCode = code.toUpperCase().trim();
    const normalizedType = type.toUpperCase().trim();

    // 2. Basic validation (cheap safety layer)
    if (new Date(expiryDate) <= new Date()) {
      throw new BadRequestException('Expiry date must be in the future');
    }

    // 3. Check duplicate code (optional but recommended)
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new BadRequestException('Promo code already exists');
    }

    // 4. Create
    return this.prisma.promoCode.create({
      data: {
        code: normalizedCode,
        type: normalizedType,
        discountPercentage: discountPercentage?.toString(),
        maxUsages,
        expiryDate,
      },
    });
  }

  async getAllPromoCodes(
    search?: string,
    page = 1,
    limit = 10,
    filter?: {
      status?: PromoCodeStatus;
    },
    sortBy: 'createdAt' | 'usedCount' | 'expiryDate' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.PromoCodeWhereInput = {};

    // 🔍 Search
    if (search?.trim()) {
      const term = search.trim();

      where.OR = [
        {
          code: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          type: {
            contains: term,
            mode: 'insensitive',
          },
        },
      ];
    }

    // 🎯 Filter
    if (filter?.status) {
      where.status = filter.status;
    }

    // 📊 Sorting
    const orderBy: Prisma.PromoCodeOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.promoCode.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),

      this.prisma.promoCode.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPromoCode(code: string) {
    const normalizedCode = code.trim();

    const promo = await this.prisma.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!promo) {
      throw new NotFoundException(`Promo code "${normalizedCode}" not found`);
    }

    return promo;
  }

  async updatePromoCode(id: string, payload: UpdatePromoCodeDto) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Promo code with id "${id}" not found`);
    }

    const updatePayload: Prisma.PromoCodeUpdateInput = {};

    if (payload.code) {
      updatePayload.code = payload.code.toUpperCase().trim();
    }

    if (payload.type) {
      updatePayload.type = payload.type.toUpperCase().trim();
    }

    if (payload.discountPercentage !== undefined) {
      updatePayload.discountPercentage = payload.discountPercentage;
    }

    if (payload.maxUsages !== undefined) {
      updatePayload.maxUsages = payload.maxUsages;
    }

    if (payload.expiryDate) {
      const expiry = new Date(payload.expiryDate);

      if (expiry <= new Date()) {
        throw new BadRequestException('Expiry date must be in the future');
      }

      updatePayload.expiryDate = expiry;
    }

    return this.prisma.promoCode.update({
      where: { id },
      data: updatePayload,
    });
  }

  async deletePromoCode(id: string) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Promo code with id "${id}" not found`);
    }

    return this.prisma.promoCode.delete({ where: { id } });
  }

  async getMyPromoCodeUsages(
    userId: string,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.PromoCodeUsageWhereInput = {
      userId,
      ...(search
        ? {
            PromoCode: {
              code: {
                contains: search,
                mode: 'insensitive',
              },
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.promoCodeUsage.findMany({
        where,
        select: {
          id: true,
          usedAt: true,
          discountAmount: true,
          PromoCode: {
            select: {
              code: true,
              type: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          usedAt: 'desc',
        },
      }),
      this.prisma.promoCodeUsage.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
