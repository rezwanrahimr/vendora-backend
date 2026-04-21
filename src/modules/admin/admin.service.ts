import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from '../auth/email.service';
import { UpdateVendorProfileDto } from './dto/update-vendor.dto';
import { format, getMonth } from 'date-fns';
import { OfferStatus, OfferType, Prisma } from '@prisma/client';
import { Parser } from 'json2csv';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async dashboardStatus() {
    const [totalVendors, totalUsers, activeOffers, redeemedOffers] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: 'VENDOR' },
        }),
        this.prisma.user.count({
          where: { role: 'USER' },
        }),
        this.prisma.offer.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.offerRedemptionEvent.count(),
      ]);

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
    const [
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions,
      suspendedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.subscription.groupBy({
        by: ['userId'],
        where: { status: 'ACTIVE' },
        _count: { userId: true },
      }),

      this.prisma.subscription.groupBy({
        by: ['userId'],
        where: { status: 'EXPIRED' },
        _count: { userId: true },
      }),

      this.prisma.user.count({
        where: { status: 'SUSPENDED' },
      }),
    ]);

    return {
      totalUsers,
      activeSubscriptionsCount: activeSubscriptions.length,
      expiredSubscriptionsCount: expiredSubscriptions.length,
      suspendedUsers,
    };
  }

  async allUsers(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Base filter
    const baseWhere: Prisma.UserWhereInput = {
      role: 'USER',
      isDeleted: false,
    };

    // Search filter
    const where: Prisma.UserWhereInput = search
      ? {
          ...baseWhere,
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : baseWhere;

    const [total, totalUsers, totalSuspended, users] = await Promise.all([
      // Pagination total (filtered)
      this.prisma.user.count({ where }),

      // Total users (no search, but still respect isDeleted)
      this.prisma.user.count({
        where: baseWhere,
      }),

      // Suspended users (also respect role + isDeleted)
      this.prisma.user.count({
        where: {
          ...baseWhere,
          status: 'SUSPENDED',
        },
      }),

      // Paginated users
      this.prisma.user.findMany({
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
            select: { offerRedemptions: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

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

  async suspendUser(id: string) {
    // First, get current status (lightweight)
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { status: true, role: true, isDeleted: true },
    });

    if (!user || user.role !== 'USER' || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    const result = await this.prisma.user.updateMany({
      where: {
        id,
        role: 'USER',
        isDeleted: false,
      },
      data: { status: newStatus },
    });

    if (result.count === 0) {
      throw new NotFoundException('User not found or already updated');
    }

    return {
      message:
        newStatus === 'SUSPENDED'
          ? 'User suspended successfully'
          : 'User activated successfully',
    };
  }

  async deleteUser(id: string) {
    // Validate target
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true, isDeleted: true },
    });

    if (!user || user.isDeleted || user.role !== 'USER') {
      throw new NotFoundException('User not found');
    }

    // Perform delete with safeguard conditions
    const result = await this.prisma.user.deleteMany({
      where: {
        id,
        role: 'USER',
        isDeleted: false,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('User not found or already deleted');
    }

    return { message: 'User deleted successfully' };
  }

  async allVendors(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: 'VENDOR',
      isDeleted: false,
      vendorProfile: { isDeleted: false },
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),

      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          vendorProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ✅ group offers by vendorId
    const offerCounts = await this.prisma.offer.groupBy({
      by: ['vendorId'],
      where: {
        isDeleted: false,
      },
      _count: {
        _all: true,
      },
    });

    const offerMap = new Map(
      offerCounts.map((o) => [o.vendorId, o._count._all]),
    );

    const transformedUsers = users.map((user) => {
      const vendorId = user.vendorProfile?.id;

      return {
        ...user,
        offersCount: vendorId ? offerMap.get(vendorId) || 0 : 0,
      };
    });

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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
      },
    });

    if (!user || user.role !== 'VENDOR' || user.isDeleted) {
      throw new NotFoundException('Vendor not found');
    }

    if (user.status === 'ACTIVE') {
      return { message: 'Vendor is already approved' };
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    try {
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
    } catch (error) {
      // log but don’t break flow
      console.error('Email sending failed:', error);
    }

    return { message: 'Vendor approved successfully' };
  }

  async rejectVendor(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
      },
    });

    if (!user || user.role !== 'VENDOR' || user.isDeleted) {
      throw new NotFoundException('Vendor not found');
    }

    // ✅ Idempotency check
    if (user.status === 'REJECTED') {
      return { message: 'Vendor is already rejected' };
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    try {
      await this.emailService.sendEmail({
        subject: 'Vendor Account Rejected',
        to: user.email,
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Sorry!</h2>
          <p>Your vendor account has been rejected. Please contact our support team for further information.</p>
          <p>Thank you for your understanding.</p>
        </div>
      `,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    return { message: 'Vendor rejected successfully' };
  }

  async updateVendor(id: string, updateData: UpdateVendorProfileDto) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // 🔒 Phone uniqueness check (safer scope)
    if (updateData.phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          phone: updateData.phone,
          NOT: { id: vendor.user.id },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    const { phone, ...vendorFields } = updateData;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.vendorProfile.update({
        where: { id },
        data: {
          businessName: vendorFields.businessName,
          streetAddress: vendorFields.streetAddress,
          city: vendorFields.city,
          contactEmail: vendorFields.contactEmail,
        },
      });

      const updatedUser = phone
        ? await tx.user.update({
            where: { id: vendor.user.id },
            data: { phone },
          })
        : vendor.user;

      return { updatedVendor, updatedUser };
    });

    return {
      message: 'Vendor updated successfully',
      vendor: result.updatedVendor,
      user: result.updatedUser,
    };
  }

  async deleteVendor(id: string) {
    const vendor = await this.prisma.user.findUnique({
      where: { id },
      include: { vendorProfile: true },
    });

    if (!vendor || vendor.role !== 'VENDOR') {
      throw new NotFoundException('Vendor not found');
    }

    if (!vendor.vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (vendor.isDeleted || vendor.vendorProfile.isDeleted) {
      throw new BadRequestException('Vendor already deleted');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      }),

      this.prisma.vendorProfile.update({
        where: { id: vendor.vendorProfile.id },
        data: { isDeleted: true },
      }),
    ]);

    return { message: 'Vendor deleted successfully' };
  }

  async changeOfferStatus(offerId: string, status?: OfferStatus) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // If no status provided → just return current offer
    if (!status) {
      return offer;
    }

    // Idempotency check
    if (offer.status === status) {
      return offer;
    }

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });
  }

  async getTopPerformingVendors() {
    // 1️⃣ Aggregate offers
    const vendorsAgg = await this.prisma.offer.groupBy({
      by: ['vendorId'],
      _count: { _all: true },
      _sum: { redeemedCount: true },
      orderBy: { _sum: { redeemedCount: 'desc' } },
      take: 5,
    });

    const vendorIds = vendorsAgg.map((v) => v.vendorId);

    // 2️⃣ Fetch all vendors in ONE query
    const vendors = await this.prisma.vendorProfile.findMany({
      where: {
        id: { in: vendorIds },
      },
      select: {
        id: true,
        businessName: true,
      },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v.businessName]));

    // 3️⃣ Transform result
    return vendorsAgg.map((v) => {
      const totalOffers = v._count._all;
      const totalRedeemed = v._sum.redeemedCount ?? 0;

      const redemptionRate =
        totalOffers > 0 ? Math.round((totalRedeemed / totalOffers) * 100) : 0;

      return {
        vendorId: v.vendorId,
        vendorName: vendorMap.get(v.vendorId) || 'Unknown',
        totalOffers,
        totalRedeemed,
        redemptionRate,
      };
    });
  }

  async offerRedeemChart(year?: number) {
    const currentYear = year ?? new Date().getFullYear();

    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear + 1, 0, 1);

    // 1️⃣ Fetch only needed field
    const events = await this.prisma.offerRedemptionEvent.findMany({
      where: {
        redeemedAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        redeemedAt: true,
      },
    });

    // 2️⃣ Initialize months using date-fns
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);

      return {
        month: i + 1,
        monthName: format(date, 'MMMM'), // 👈 date-fns
        totalRedemptions: 0,
      };
    });

    // 3️⃣ Group using date-fns getMonth
    for (const event of events) {
      const monthIndex = getMonth(event.redeemedAt); // 0-11
      chartData[monthIndex].totalRedemptions += 1;
    }

    return chartData;
  }

  async adminRedeemedOfferStats() {
    const [totalOffers, totalActiveOffers, totalRedemptions] =
      await Promise.all([
        this.prisma.offer.count({
          where: { isDeleted: false },
        }),

        this.prisma.offer.count({
          where: { isDeleted: false, status: 'ACTIVE' },
        }),

        this.prisma.offerRedemption.count(),
      ]);

    const avgRedemptionsPerOffer =
      totalOffers > 0 ? totalRedemptions / totalOffers : 0;

    return {
      totalOffers,
      totalActiveOffers,
      totalRedemptions,
      avgRedemptionsPerOffer: Number(avgRedemptionsPerOffer.toFixed(2)),
    };
  }

  async offerTypeDistribution() {
    const data = await this.prisma.offer.groupBy({
      by: ['type'],
      where: { isDeleted: false },
      _count: {
        _all: true,
      },
    });

    const map = new Map(data.map((d) => [d.type, d._count._all]));

    const types: OfferType[] = ['BOGO', 'DISCOUNT', 'SPECIAL'];

    const total = types.reduce((sum, t) => sum + (map.get(t) || 0), 0);

    return types.map((type) => {
      const count = map.get(type) || 0;

      return {
        label: type,
        count,
        value: total ? Number(((count / total) * 100).toFixed(2)) : 0,
      };
    });
  }

  async exportRedemptionTrendsToCsv(year?: number): Promise<string> {
    const data = await this.offerRedeemChart(year);

    const fields = [
      { label: 'Month', value: 'monthName' },
      { label: 'Redemptions', value: 'totalRedemptions' },
    ];

    const parser = new Parser({
      fields,
      defaultValue: '0',
    });

    const csvData = parser.parse(data);

    const header = year
      ? `Redemption Trends for ${year}`
      : `Redemption Trends for ${new Date().getFullYear()}`;

    // ✅ UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';

    return `${BOM}${header}\n\n${csvData}`;
  }

  async exportVendorPerformanceToCsv(): Promise<string> {
    const data = await this.getTopPerformingVendors();

    const fields = [
      { label: 'Vendor ID', value: 'vendorId' },
      { label: 'Vendor Name', value: 'vendorName' },
      { label: 'Total Offers', value: 'totalOffers' },
      { label: 'Total Redeemed', value: 'totalRedeemed' },
      { label: 'Redemption Ratio (%)', value: 'redemptionRatio' },
    ];

    const parser = new Parser({
      fields,
      defaultValue: '0',
    });

    const csvData = parser.parse(data);

    const header = 'Top Performing Vendors';

    // ✅ Excel-safe encoding
    const BOM = '\uFEFF';

    return `${BOM}${header}\n\n${csvData}`;
  }
}
