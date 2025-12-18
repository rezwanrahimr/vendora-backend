import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { RegisterDto, RegisterVendorDto, LoginDto, VerifyEmailDto } from './dto';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, role, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = this.emailService.generateVerificationCode();
    const verificationCodeExpiry = this.emailService.getCodeExpiry();


    const user = await this.prisma.$transaction(async (tx) => {

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'USER',
          status: 'ACTIVE', // Regular users are active by default
          verificationCode,
          verificationCodeExpiry,
          isEmailVerified: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.userNotification.create({
        data: {
          userId: newUser.id,
          newOffer: true,
          renewalReminder: true,
          promotional: true,
        }
      });

      return newUser;

    })


    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationCode, '');

    return {
      message: 'User registered successfully. Please check your email for verification code.',
      user,
    };
  }

  async registerVendor(registerVendorDto: RegisterVendorDto) {
    const { email, password, name, streetAddress, city, zipCode } = registerVendorDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = this.emailService.generateVerificationCode();
    const verificationCodeExpiry = this.emailService.getCodeExpiry();

    // Create user with vendor profile and PENDING status

    const user = await this.prisma.$transaction(async (tx) => {

      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'VENDOR',
          status: 'PENDING', // Vendors start as PENDING
          verificationCode,
          verificationCodeExpiry,
          isEmailVerified: false,
          vendorProfile: {
            create: {
              streetAddress,
              city,
              zipCode,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          vendorProfile: true,
          createdAt: true,
        },
      });

      await tx.userNotification.create({
        data: {
          userId: newUser.id,
          newOffer: true,
          renewalReminder: true,
          promotional: true,
        }
      });

      return newUser;

    })



    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationCode, name || '');

    return {
      message: 'Vendor registered successfully. Please check your email for verification code. Your account will be reviewed by admin.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with vendor profile if exists
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check if user status is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Check if code is expired
    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    // Update user as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
      include: {
        vendorProfile: true,
      },
    });

    // Generate JWT token
    const payload = { sub: updatedUser.id, email: updatedUser.email, role: updatedUser.role };
    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      message: 'Email verified successfully',
      user: userWithoutPassword,
      accessToken,
    };
  }
}
