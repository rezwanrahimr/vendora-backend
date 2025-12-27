import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from '../auth/email.service';
import {
  UpdateVendorProfileDto,
  VendorUpdateDto,
} from './dto/update-vendor.dto';
import { format, getMonth } from 'date-fns';
import { OfferStatus, UserStatus } from '@prisma/client';
import { Parser } from 'json2csv';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async dashboardStatus() {
    const totalVendors = await this.prisma.user.count({
      where: { role: 'VENDOR' },
    });

    const totalUsers = await this.prisma.user.count({
      where: { role: 'USER' },
    });

    const activeOffers = await this.prisma.offer.count({
      where: { status: 'ACTIVE' },
    });

    const redeemedOffers = await this.prisma.offerRedemptionEvent.count();

    return {
      totalVendors,
      totalUsers,
      activeOffers,
      redeemedOffers,
    };
  }

  async getProfile(id: string) {
    const admin = await this.prisma.user.findFirst({
      where: { id, role: 'ADMIN' },
      select: {
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        location: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return admin;
  }

  async usersStatus() {
    const totalUsers = await this.prisma.user.count();
    const activeSubscriptions = 0;
    const expiredSubscriptions = 0;
    const suspendedUsersCount = await this.prisma.user.findMany({
      where: { status: 'SUSPENDED' },
    });

    return {
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedUsers: suspendedUsersCount.length,
    };
  }

  // async allUsers(search?: string, page: number = 1, limit: number = 10) {
  //   const skip = (page - 1) * limit;

  //   // Build the where condition
  //   const where: any = {
  //     role: 'USER',
  //   };
  //   if (search) {
  //     where.OR = [
  //       { email: { contains: search, mode: 'insensitive' } },
  //       { name: { contains: search, mode: 'insensitive' } },
  //     ];
  //   }

  //   // Get total count for pagination
  //   const total = await this.prisma.user.count({ where });

  //   // Get paginated users
  //   const users = await this.prisma.user.findMany({
  //     where,
  //     select: {
  //       id: true,
  //       name: true,
  //       email: true,
  //       phone: true,
  //       role: true,
  //       status: true,
  //       createdAt: true,
  //     },
  //     skip,
  //     take: limit,
  //     orderBy: { createdAt: 'desc' },
  //   });

  //   return {
  //     statistics: {
  //       totalUsers: total,
  //     },
  //     users,
  //     pagination: {
  //       total,
  //       page,
  //       limit,
  //       pages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  async allUsers(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Build the where condition
    const where: any = {
      role: 'USER',
      isDeleted: false,
    };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    const totalUsers = await this.prisma.user.count({
      where: {
        role: 'USER',
      },
    });

    const totalSuspended = await this.prisma.user.count({
      where: { status: 'SUSPENDED' },
    });

    // Get paginated users with redeem count
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { offerRedemptions: true }, // count of redeemed offers
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Format users with redeem count
    const formattedUsers = users.map((user) => ({
      ...user,
      redeemedOfferCount: user._count.offerRedemptions,
    }));

    return {
      statistics: {
        totalUsers,
        suspendedUsers: totalSuspended,
      },
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
    return { message: 'User deleted successfully' };
  }

  async allVendors(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Build the where condition
    const where: any = {
      role: 'VENDOR',
      vendorProfile: { isDeleted: false },
      isDeleted: false,
    };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get paginated users
    const users = await this.prisma.user.findMany({
      where,
      omit: {
        password: true,
        createdAt: true,
        updatedAt: true,
        verificationCode: true,
        verificationCodeExpiry: true,
        fcmTokens: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendorProfile: true,
      },
    });

    // Transform data to include offers count
    const transformedUsers = await Promise.all(
      users.map(async (user) => {
        const offersCount = await this.prisma.offer.count({
          where: {
            VendorProfile: {
              userId: user.id,
            },
          },
        });

        return {
          ...user,
          offersCount,
        };
      }),
    );

    return {
      users: transformedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async approvedVendor(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'VENDOR') {
      throw new NotFoundException('Vendor not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.emailService.sendEmail({
      subject: 'Vendor Account Approved',
      to: user.email,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Congratulations!</h2>
          <p>Your vendor account has been approved. You can now start using our platform to offer your products and services.</p>
          <p>Thank you for joining us!</p>
        </div>
      `,
    });

    return { message: 'Vendor approved successfully' };
  }

  async updateVendor(id: string, updateData: UpdateVendorProfileDto) {
    // Find vendor profile first
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    // Check for unique phone if phone is updated
    if (updateData.phone) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phone: updateData.phone },
      });
      // Throw only if phone belongs to a different user
      if (existingUser && existingUser.id !== vendor.user.id) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    // Prepare update data
    const vendorFields: Partial<UpdateVendorProfileDto> = {};
    const userFields: Partial<UpdateVendorProfileDto> = {};

    Object.keys(updateData).forEach((key) => {
      const value = updateData[key as keyof UpdateVendorProfileDto];
      if (value !== undefined) {
        if (
          [
            'businessName',
            'streetAddress',
            'city',
            'zipCode',
            'categoryId',
            'logoUrl',
            'contactEmail',
          ].includes(key)
        ) {
          vendorFields[key as keyof UpdateVendorProfileDto] = value;
        } else if (key === 'phone') {
          userFields[key as keyof UpdateVendorProfileDto] = value;
        }
      }
    });

    // Run updates in a proper transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendorProfile.update({
        where: { id },
        data: vendorFields,
      });

      let updatedUser = vendor.user;
      if (Object.keys(userFields).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: vendor.user.id },
          data: userFields,
        });
      }

      return { updatedVendor, updatedUser };
    });

    return {
      message: 'Vendor updated successfully',
      vendor: result.updatedVendor,
      user: result.updatedUser,
    };
  }

  async deleteVendor(id: string) {
    const vendor = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'VENDOR',
       
      },
      omit: {
        password: true,
      },
      include: { vendorProfile: true },
    });

    if (!vendor || !vendor.vendorProfile) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.isDeleted || vendor.vendorProfile.isDeleted)
      throw new BadRequestException('Vendor already deleted');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      }),
      this.prisma.vendorProfile.updateMany({
        where: { userId: id, isDeleted: false },
        data: { isDeleted: true },
      }),
    ]);

    return { message: 'Vendor deleted successfully' };
  }

  async changeOfferStatus(offerId: string, status?: OfferStatus) {
    // Check if offer exists
    const existingOffer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!existingOffer) {
      throw new NotFoundException('Offer not found');
    }

    // If no status provided, return the offer as-is
    if (!status) {
      return existingOffer;
    }

    // Update the offer status
    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });

    return updatedOffer;
  }

  async getTopPerformingVendors() {
    // 1️⃣ Aggregate offers by vendorId using Prisma's aggregate on Offer
    const vendorsAgg = await this.prisma.offer.groupBy({
      by: ['vendorId'],
      _count: { id: true }, // total offers
      _sum: { redeemedCount: true }, // total redeemed
      orderBy: { _sum: { redeemedCount: 'desc' } },
      take: 5,
    });

    // 2️⃣ Fetch vendor names
    const result = await Promise.all(
      vendorsAgg.map(async (v) => {
        const vendor = await this.prisma.vendorProfile.findUnique({
          where: { id: v.vendorId },
          select: { businessName: true },
        });

        const totalOffers = v._count.id;
        const totalRedeemed = v._sum.redeemedCount ?? 0;
        const redemptionRatio =
          totalOffers > 0 ? Math.round((totalRedeemed / totalOffers) * 100) : 0;

        return {
          vendorId: v.vendorId,
          vendorName: vendor?.businessName || 'Unknown',
          totalOffers,
          totalRedeemed,
          redemptionRatio,
        };
      }),
    );

    return result;
  }

  async offerRedeemChart(year?: number) {
    const currentYear = year ?? new Date().getFullYear();

    // 1️⃣ Fetch all redemption events for the given year
    const events = await this.prisma.offerRedemptionEvent.findMany({
      where: {
        redeemedAt: {
          gte: new Date(currentYear, 0, 1), // Jan 1 of year
          lt: new Date(currentYear + 1, 0, 1), // Jan 1 of next year
        },
      },
      select: {
        redeemedAt: true,
      },
    });

    // 2️⃣ Initialize array for 12 months with names
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      return {
        month: i + 1,
        monthName: format(date, 'MMMM'), // full month name
        totalRedemptions: 0,
      };
    });

    // 3️⃣ Count redemptions per month
    events.forEach((event) => {
      const month = getMonth(event.redeemedAt); // 0 = Jan, 11 = Dec
      chartData[month].totalRedemptions += 1;
    });

    return chartData;
  }

  async adminRedeemedOfferStats() {
    // 1️⃣ Total offers (not deleted)
    const totalOffers = await this.prisma.offer.count({
      where: { isDeleted: false },
    });

    // 2️⃣ Total active offers
    const totalActiveOffers = await this.prisma.offer.count({
      where: { isDeleted: false, status: 'ACTIVE' },
    });

    // 3️⃣ Total redemptions
    const totalRedemptions = await this.prisma.offerRedemption.count();

    // 4️⃣ Redemption rate = totalRedemptions / totalOffers
    const redemptionRate =
      totalOffers > 0 ? (totalRedemptions / totalOffers) * 100 : 0;

    return {
      totalOffers,
      totalActiveOffers,
      totalRedemptions,
      redemptionRate: Number(redemptionRate.toFixed(2)), // rounded to 2 decimals
    };
  }

  async offerTypeDistribution() {
    const [bogo, discount, special] = await Promise.all([
      this.prisma.offer.count({ where: { type: 'BOGO' } }),
      this.prisma.offer.count({ where: { type: 'DISCOUNT' } }),
      this.prisma.offer.count({ where: { type: 'SPECIAL' } }),
    ]);

    const total = bogo + discount + special;

    if (total === 0) {
      return [
        { label: 'BOGO', value: 0, count: 0 },
        { label: 'DISCOUNT', value: 0, count: 0 },
        { label: 'SPECIAL', value: 0, count: 0 },
      ];
    }

    const pct = (n: number) => Number(((n / total) * 100).toFixed(2));

    return [
      { label: 'BOGO', value: pct(bogo), count: bogo },
      { label: 'DISCOUNT', value: pct(discount), count: discount },
      { label: 'SPECIAL', value: pct(special), count: special },
    ];
  }

  async exportRedemptionTrendsToCsv(year?: number): Promise<string> {
    // 1️⃣ Fetch redemption chart data
    const data = await this.offerRedeemChart(year);

    // 2️⃣ Define CSV fields
    const fields = [
      { label: 'Month', value: 'monthName' },
      { label: 'Redemptions', value: 'totalRedemptions' },
    ];

    // 3️⃣ Generate CSV content for the data
    const parser = new Parser({ fields });
    const csvData = parser.parse(data);

    // 4️⃣ Add custom header row
    const header = year
      ? `Redemption Trends for ${year}`
      : `Redemption Trends for ${new Date().getFullYear()}`;
    const csv = `${header}\n\n${csvData}`; // double newline for separation

    return csv;
  }

  async exportVendorPerformanceToCsv(): Promise<string> {
    // 1️⃣ Fetch top-performing vendors
    const data = await this.getTopPerformingVendors();

    // 2️⃣ Define CSV fields
    const fields = [
      { label: 'Vendor ID', value: 'vendorId' },
      { label: 'Vendor Name', value: 'vendorName' },
      { label: 'Total Offers', value: 'totalOffers' },
      { label: 'Total Redeemed', value: 'totalRedeemed' },
      { label: 'Redemption Ratio (%)', value: 'redemptionRatio' },
    ];

    // 3️⃣ Generate CSV content
    const parser = new Parser({ fields });
    const csvData = parser.parse(data);

    // 4️⃣ Optional header row
    const header = 'Top Performing Vendors';
    const csv = `${header}\n\n${csvData}`;

    return csv;
  }
}
