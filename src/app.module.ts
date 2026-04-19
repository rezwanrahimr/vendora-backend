import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaModule } from './prisma.module';
import { OfferModule } from './modules/offer/offer.module';
import { CategoryModule } from './modules/category/category.module';
import { AdminLegalModule } from './modules/admin-legal/admin-legal.module';
import { AdminNotificationModule } from './modules/admin-notification/admin-notification.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminGeneralModule } from './modules/admin-general/admin-general.module';
import { AppHeroSliderModule } from './modules/app-hero-slider/app-hero-slider.module';
import { UploadFileModule } from './common/upload-files/upload-file.module';
import { SubscriptionPlanModule } from './modules/subscription-plan/subscription-plan.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    VendorsModule,
    AdminModule,
    PrismaModule,
    OfferModule,
    CategoryModule,
    AdminLegalModule,
    AdminNotificationModule,
    NotificationModule,
    AdminGeneralModule,
    AppHeroSliderModule,
    UploadFileModule,
    SubscriptionPlanModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
