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

  // TODO: This is a dummy checkout, later we will integrate nestpay
 async checkoutPayment(paymentId: string, userId: string) {
  const payment = await this.prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      Subscription: true,
    },
  });

  if (!payment) {
    throw new NotFoundException('Payment not found');
  }

  // 🔒 Ownership check (via subscription)
  if (payment.Subscription.userId !== userId) {
    throw new BadRequestException('Unauthorized payment access');
  }

  // 🔒 Idempotency guard
  if (payment.status === 'COMPLETED') {
    return { message: 'Payment already completed' };
  }

  return this.prisma.$transaction(async (tx) => {
    // 1. Mark payment as COMPLETED (dummy flow)
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        providerTransactionId: `DUMMY_${Date.now()}`,
      },
    });

    // 2. Activate subscription
    await tx.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: 'ACTIVE',
        paymentStatus: 'COMPLETED',
      },
    });

    // 3. Update user
    await tx.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
      },
    });

    return {
      message: 'Payment processed successfully (dummy flow)',
      paymentId,
      subscriptionId: payment.subscriptionId,
    };
  });
}
}
