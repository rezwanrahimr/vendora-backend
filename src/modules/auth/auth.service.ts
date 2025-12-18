import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RegisterDto, RegisterVendorDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }

  async registerVendor(registerVendorDto: RegisterVendorDto) {
    const { email, password, name, businessName, businessAddress, phoneNumber, taxId, description } = registerVendorDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with vendor profile
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'VENDOR',
        vendorProfile: {
          create: {
            businessName,
            businessAddress,
            phoneNumber,
            taxId,
            description,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        vendorProfile: true,
        createdAt: true,
      },
    });

    return {
      message: 'Vendor registered successfully',
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

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Login successful',
      user: userWithoutPassword,
      // TODO: Add JWT token here
    };
  }
}
