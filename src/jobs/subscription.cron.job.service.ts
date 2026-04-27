import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubscriptionCronJobService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(SubscriptionCronJobService.name);

  private isRunning = false;

  // 🔥 Run more frequently for correctness
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

    const result = await this.prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: now },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    // ⚠️ Keep user sync efficient (single query, no loops)
    const userUpdateResult = await this.prisma.user.updateMany({
      where: {
        isSubscribed: true,
        subscriptions: {
          none: {
            status: SubscriptionStatus.ACTIVE,
          },
        },
      },
      data: {
        isSubscribed: false,
      },
    });

    this.logger.log(`Expired subscriptions: ${result.count}`);
    this.logger.log(`Users updated: ${userUpdateResult.count}`);
  }

  // 🟢 Activate PENDING subscriptions (batch safe)
  private async activatePendingSubscriptions() {
    const now = new Date();
    const BATCH_SIZE = 200;

    let processed = 0;

    while (true) {
      const pending = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.PENDING,
          startDate: { lte: now },
        },
        select: { id: true },
        take: BATCH_SIZE,
        orderBy: { startDate: 'asc' },
      });

      if (pending.length === 0) break;

      await this.prisma.subscription.updateMany({
        where: {
          id: { in: pending.map((s) => s.id) },
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });

      processed += pending.length;
    }

    this.logger.log(`Activated subscriptions: ${processed}`);
  }
}
