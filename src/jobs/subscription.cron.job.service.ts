import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubscriptionCronJobService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(SubscriptionCronJobService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
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

    this.logger.log(`Expired ${result.count} subscriptions`);
  }
}
