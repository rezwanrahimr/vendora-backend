import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PaymentStatus,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PaymentCronJobService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(PaymentCronJobService.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expirePendingPayments() {
    const expiryMinutes = 30;
    const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);

    // 1. Fetch expired pending payments
    const expired = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        subscriptionId: true,
        userId: true,
      },
    });

    if (expired.length === 0) {
      return;
    }

    const paymentIds = expired.map((p) => p.id);
    const subscriptionIds = expired.map((p) => p.subscriptionId);
    const userIds = [...new Set(expired.map((p) => p.userId))];

    // 2. Run batch updates in transaction
    await this.prisma.$transaction([
      // ❌ Mark payments as failed
      this.prisma.payment.updateMany({
        where: { id: { in: paymentIds } },
        data: { status: PaymentStatus.FAILED },
      }),

      // ❌ Cancel subscriptions
      this.prisma.subscription.updateMany({
        where: { id: { in: subscriptionIds } },
        data: {
          status: SubscriptionStatus.CANCELLED,
          paymentStatus: SubscriptionPaymentStatus.FAILED, // ✅ fixed
        },
      }),

      // ❌ Reset user subscription flag
      this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isSubscribed: false },
      }),
    ]);

    this.logger.log(
      `Expired ${paymentIds.length} payments and cancelled subscriptions`,
    );
  }
}
