import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/common/enums/user-role.enum";

@ApiTags('Admin')
@Controller('admin')
@ApiSecurity("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard/users-status')
    @ApiOperation({ summary: 'Get users status' })
    @ApiResponse({ status: 200, description: 'Users status retrieved successfully' })
    usersStatus() {
        return this.adminService.usersStatus();
    }

    @Get('users')
    @ApiOperation({ summary: 'Search users' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by email or name' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    allUsers(
        @Query('search') search?: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.adminService.allUsers(search, parseInt(page), parseInt(limit));
    }

}