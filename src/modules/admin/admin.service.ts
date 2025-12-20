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
}