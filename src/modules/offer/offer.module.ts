import { Module, forwardRef } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [OfferController],
  providers: [OfferService, PrismaService],
  exports: [OfferService],
})
export class OfferModule {}
