import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/common/enums/user-role.enum";

@ApiTags('Admin')
@Controller('admin')
@ApiSecurity("JWT") // Apply JWT security scheme to all endpoints in this controller
@UseGuards(JwtAuthGuard) // All routes require authentication
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('/users/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get users status' })
    @ApiResponse({ status: 200, description: 'Users status retrieved successfully' })
    usersStatus() {
        return this.adminService.usersStatus();
    }

}