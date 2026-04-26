import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePromoCodeDto } from './dto/promo-code.dto';

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

    const createBody = {
      code: normalizedCode,
      type: normalizedType,
      discountPercentage:discountPercentage?.toString(),
      maxUsages,
      expiryDate,
    };

    console.log("🚀 ~ promo-code.service.ts:41 ~ PromoCodeService ~ createPromoCode ~ createBody:", createBody)


    // 4. Create
    return this.prisma.promoCode.create({
      data: {
        code: normalizedCode,
        type: normalizedType,
        discountPercentage:discountPercentage?.toString(),
        maxUsages,
        expiryDate,
      },
    });
  }
}
