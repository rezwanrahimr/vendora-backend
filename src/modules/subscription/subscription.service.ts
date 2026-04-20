import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  //TODO:  later will add coupon code and other features
  async bookSubscription(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('User is not active');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const now = new Date();

    // 🚨 Prevent multiple active subscriptions
    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: now },
      },
    });

    if (existingActive) {
      throw new BadRequestException('User already has an active subscription');
    }

    const subscriptionEnd = new Date(
      now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Create subscription (PENDING)
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          price: plan.price,
          finalPrice: plan.price,
          discountAmount: 0,
          startDate: now,
          endDate: subscriptionEnd,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // 2. Create payment (PENDING)
      const payment = await tx.payment.create({
        data: {
          amount: plan.price,
          provider: 'NESTPAY',
          status: 'PENDING',
          subscriptionId: subscription.id,
          userId,
        },
      });

      return {
        subscription,
        payment,
      };
    });
  }
}
