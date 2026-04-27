import { Injectable, NotFoundException } from '@nestjs/common';
import { OfferStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminOfferManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async changeOfferStatus(offerId: string, status?: OfferStatus) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // If no status provided → just return current offer
    if (!status) {
      return offer;
    }

    // Idempotency check
    if (offer.status === status) {
      return offer;
    }

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });
  }
}
