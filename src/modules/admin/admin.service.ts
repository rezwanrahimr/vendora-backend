import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService
    ) { }

    async usersStatus() {

        const totalUsers = await this.prisma.user.count();
        const activeSubscriptions = 0;
        const expiredSubscriptions = 0;
        const suspendedUsersCount = await this.prisma.user.findMany({
            where: { status: 'SUSPENDED' }
        });

        return {
            totalUsers,
            activeSubscriptions,
            expiredSubscriptions,
            suspendedUsers: suspendedUsersCount.length,
        }
    }


    async allUsers(search?: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        // Build the where condition
        const where: any = {
            role: 'USER',
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
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return {
            users,
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
            where: { id }
        });
        return { message: 'User deleted successfully' };
    }


      async allVendors(search?: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        // Build the where condition
        const where: any = {
            role: 'VENDOR',
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
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
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
            })
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
}