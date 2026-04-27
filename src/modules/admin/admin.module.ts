import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from '../auth/email.service';
import { AdminVendorManagementService } from './admin-vendor-management.service';
import { AdminUserManagementsService } from './admin-user-managements.service';
import { AdminOfferManagementService } from './admin-offer-management.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminExportService } from './admin-export.service';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    PrismaService,
    EmailService,
    AdminVendorManagementService,
    AdminUserManagementsService,
    AdminOfferManagementService,
    AdminAnalyticsService,
    AdminDashboardService,
    AdminExportService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
