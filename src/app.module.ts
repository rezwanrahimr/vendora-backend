import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { AdminModule } from './modules/admin/admin.module';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { OfferModule } from './modules/offer/offer.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    VendorsModule,
    AdminModule,
    PrismaModule,
    OfferModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
