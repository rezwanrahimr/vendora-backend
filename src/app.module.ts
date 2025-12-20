import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { AppService } from './app.service';
import { OfferModule } from './offer/offer.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [AuthModule, UsersModule, VendorsModule, OfferModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
