import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubscriptionCronJobService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(SubscriptionCronJobService.name);

  private isRunning = false;

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncSubscriptions() {
    if (this.isRunning) return;

    this.isRunning = true;

    try {
      await this.activatePendingSubscriptions();
      await this.expireSubscriptions();
    } finally {
      this.isRunning = false;
    }
  }

  // 🔴 Expire ACTIVE subscriptions
  private async expireSubscriptions() {
    const now = new Date();

    // 1. Expire subscriptions
    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: now },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    // 2. Sync users (only those who truly have no active subscription)
    const usersUpdated = await this.prisma.user.updateMany({
      where: {
        isSubscribed: true,
        subscriptions: {
          none: {
            status: SubscriptionStatus.ACTIVE,
            endDate: { gt: now }, // ✅ important fix
          },
        },
      },
      data: {
        isSubscribed: false,
      },
    });

    this.logger.log(`Expired subscriptions: ${expired.count}`);
    this.logger.log(`Users updated: ${usersUpdated.count}`);
  }

  // 🟢 Activate PENDING subscriptions (FREE only)
  private async activatePendingSubscriptions() {
    const now = new Date();
    const BATCH_SIZE = 200;

    let processed = 0;

    while (true) {
      const pending = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.PENDING,
          startDate: { lte: now },
          isFree: true, // ✅ explicit: only free subscriptions
        },
        select: {
          id: true,
          userId: true,
        },
        take: BATCH_SIZE,
        orderBy: { startDate: 'asc' },
      });

      if (pending.length === 0) break;

      const subscriptionIds = pending.map((s) => s.id);
      const userIds = [...new Set(pending.map((s) => s.userId))];

      await this.prisma.$transaction([
        // 1. Activate subscriptions
        this.prisma.subscription.updateMany({
          where: { id: { in: subscriptionIds } },
          data: { status: SubscriptionStatus.ACTIVE },
        }),

        // 2. Mark users as subscribed
        this.prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isSubscribed: true },
        }),
      ]);

      processed += pending.length;
    }

    this.logger.log(`Activated subscriptions: ${processed}`);
  }
}
