import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { CacheService } from './cache.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      signOptions: {
        expiresIn: '7d',
      },
    }),
    CacheModule.register({
      ttl: 900000, // 15 minutes default
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, CacheService, JwtStrategy, PrismaService],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule { }
