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
}