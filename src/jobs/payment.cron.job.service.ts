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

    // 1. Find affected payment + subscription IDs first
    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        subscriptionId: true,
      },
    });

    if (!pendingPayments.length) return;

    const paymentIds = pendingPayments.map((p) => p.id);
    const subscriptionIds = pendingPayments.map((p) => p.subscriptionId);

    // 2. Batch update payments
    await this.prisma.payment.updateMany({
      where: {
        id: { in: paymentIds },
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    // 3. Batch update subscriptions
    await this.prisma.subscription.updateMany({
      where: {
        id: { in: subscriptionIds },
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
        paymentStatus: SubscriptionPaymentStatus.PENDING,
      },
    });

    this.logger.log(`Expired ${paymentIds.length} pending payments in batch`);
  }
}
