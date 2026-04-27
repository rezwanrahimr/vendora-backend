import { Module } from '@nestjs/common';
import { PaymentCronJobService } from './payment.cron.job.service';
import { SubscriptionCronJobService } from './subscription.cron.job.service';

@Module({
  providers: [PaymentCronJobService, SubscriptionCronJobService],
})
export class CronJobModule {}
