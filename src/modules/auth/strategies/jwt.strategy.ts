import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma.service';
import { AuthService } from '../auth.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extract token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Check if token is blacklisted
    if (token && await this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub.toString() },
      include: {
        vendorProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    console.log('JWT Strategy - User found:', { id: user.id, email: user.email, role: user.role, status: user.status });

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
