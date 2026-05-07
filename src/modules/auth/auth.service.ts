import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import {
  RegisterDto,
  RegisterVendorDto,
  LoginDto,
  VerifyEmailDto,
  SendResetCodeDto,
  VerifyResetCodeDto,
  ConfirmResetPasswordDto,
  ChangePasswordDto,
  LoginWithGoogleDto,
} from './dto';
import { EmailService } from './email.service';
import { CacheService } from './cache.service';
import { ResponseDto } from '../../common/dto/response.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private cacheService: CacheService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role, name, mobileNumber } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: mobileNumber },
    });

    if (existingPhone) {
      throw new ConflictException('User with this mobile number already exists');
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
          phone: mobileNumber,
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
        },
      });

      return newUser;
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationCode, '');

    return new ResponseDto(
      true,
      'User registered successfully. Please check your email for verification code.',
      { user },
    );
  }

  async registerVendor(registerVendorDto: RegisterVendorDto) {
    const {
      email,
      password,
      name,
      streetAddress,
      city,
      zipCode,
      categoryId,
      mobileNumber,
    } = registerVendorDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: mobileNumber },
    });

    if (existingPhone) {
      throw new ConflictException('User with this mobile number already exists');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = this.emailService.generateVerificationCode();
    const verificationCodeExpiry = this.emailService.getCodeExpiry();

    // Create user with vendor profile and PENDING status

    const user = await this.prisma.$transaction(async (tx) => {
      // Ensure default category exists
      // const defaultCategoryId = '00000000-0000-0000-0000-000000000000';
      // let defaultCategory = await tx.category.findUnique({
      //   where: { id: defaultCategoryId },
      // });

      // if (!defaultCategory) {
      //   defaultCategory = await tx.category.create({
      //     data: {
      //       id: defaultCategoryId,
      //       name: 'General',
      //       icon: '🏪',
      //     },
      //   });
      // }

      const newUser = await tx.user.create({
        data: {
          email,
          phone: mobileNumber,
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
              businessName: registerVendorDto.businessName || '',
              city,
              zipCode,
              categoryId: category.id,
              about: registerVendorDto.about || '',
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
        },
      });

      return newUser;
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      email,
      verificationCode,
      name || '',
    );

    return new ResponseDto(
      true,
      'Vendor registered successfully. Please check your email for verification code. Your account will be reviewed by admin.',
      { user },
    );
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
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // Check if user status is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Account is not active. Please contact support.',
      );
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

    return new ResponseDto(true, 'Login successful', {
      user: userWithoutPassword,
      accessToken,
    });
  }

  async loginWithGoogle(loginWithGoogleDto: LoginWithGoogleDto) {
    let user = await this.prisma.user.findUnique({
      where: {
        email: loginWithGoogleDto.email,
      },
      omit: {
        password: true,
      },
    });
    // TODO add isGoogleLogin flag
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: loginWithGoogleDto.email,
          phone: `google-${crypto.randomUUID()}`,
          name: loginWithGoogleDto.name,
          role: 'USER',
          status: 'ACTIVE',
          isEmailVerified: true,
          password: '',
          imageUrl: loginWithGoogleDto.imageUrl,
        },
        omit: {
          password: true,
        },
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Account is not active. Please contact support.',
      );
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return new ResponseDto(true, 'Login successful', {
      user,
      accessToken,
    });
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
    if (
      !user.verificationCodeExpiry ||
      user.verificationCodeExpiry < new Date()
    ) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
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
    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return new ResponseDto(true, 'Email verified successfully', {
      user: userWithoutPassword,
      accessToken,
    });
  }

  // Step 1: Send verification code to email
  async sendResetCode(sendResetCodeDto: SendResetCodeDto) {
    const { email } = sendResetCodeDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found (security best practice)
      return new ResponseDto(
        false,
        'User with that email does not exist',
        null,
      );
    }

    // Generate 6-digit verification code
    const resetCode = this.emailService.generateVerificationCode();

    // Store code in cache with 15 minute expiry
    await this.cacheService.setResetCode(email, resetCode, 900);

    // Send reset code email
    await this.emailService.sendPasswordResetEmail(
      email,
      resetCode,
      user.name || '',
    );

  }

  // Step 2: Verify code and return short-lived token
  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    const { email, code } = verifyResetCodeDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification code or email');
    }

    // Get stored code from cache
    const storedCode = await this.cacheService.getResetCode(email);

    if (!storedCode) {
      throw new BadRequestException(
        'Verification code has expired or does not exist',
      );
    }

    // Verify code matches
    if (storedCode !== code) {
      throw new BadRequestException('Invalid verification code or email');
    }

    // Generate short-lived reset token (random string)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store token in cache with 10 minute expiry
    await this.cacheService.setResetToken(resetToken, email, 600);

    // Delete the verification code
    await this.cacheService.deleteResetCode(email);

    return new ResponseDto(
      true,
      'Verification successful. Use the token to reset your password.',
      { resetToken },
    );
  }

  // Step 3: Use token to reset password
  async confirmResetPassword(confirmResetPasswordDto: ConfirmResetPasswordDto) {
    const { token, newPassword } = confirmResetPasswordDto;

    // Get email from token
    const email = await this.cacheService.getEmailFromToken(token);

    if (!email) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Delete the reset token
    await this.cacheService.deleteResetToken(token);

    return new ResponseDto(
      true,
      'Password reset successfully. You can now login with your new password.',
      null,
    );
  }

  // Change password for authenticated user
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId.toString() },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId.toString() },
      data: {
        password: hashedPassword,
      },
    });

    return new ResponseDto(true, 'Password changed successfully', null);
  }

  // Logout - blacklist token
  async logout(userId: number, token: string) {
    // Extract token expiry time
    const decoded = this.jwtService.decode(token) as { exp: number };

    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);

      if (ttl > 0) {
        // Store token in blacklist cache until it expires
        await this.cacheService.setResetToken(
          `blacklist:${token}`,
          String(userId),
          ttl,
        );
      }
    }

    return new ResponseDto(true, 'Logged out successfully', null);
  }

  // Helper method to check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.cacheService.getEmailFromToken(
      `blacklist:${token}`,
    );
    return !!blacklisted;
  }
}
