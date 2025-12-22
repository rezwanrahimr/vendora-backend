import {Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaService } from "src/prisma.service";
import { EmailService } from "../auth/email.service";

@Module({
    controllers: [AdminController],
    providers: [AdminService, PrismaService, EmailService],
    exports: [AdminService]
})
export class AdminModule {};