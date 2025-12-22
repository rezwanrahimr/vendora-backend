import { Controller, Get, UseGuards, Query, Delete, Param, Patch } from "@nestjs/common";
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

    @Get('users/status')
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


    @Delete('user/:id')
    @ApiOperation({ summary: 'Delete a user by ID' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }



    @Get('vendors')
    @ApiOperation({ summary: 'Search vendors' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by email or name' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
    allVendors(
        @Query('search') search?: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.adminService.allVendors(search, parseInt(page), parseInt(limit));
    }

    @Patch('vendor/:id/approve')
    @ApiOperation({ summary: 'Approve a vendor by ID' })
    @ApiResponse({ status: 200, description: 'Vendor approved successfully' })
    approvedVendor(@Param('id') id: string) {
        return this.adminService.approvedVendor(id);
    }

}