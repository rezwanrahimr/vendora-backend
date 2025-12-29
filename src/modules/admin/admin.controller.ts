import {
  Controller,
  Get,
  UseGuards,
  Query,
  Delete,
  Param,
  Patch,
  Body,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ChangeVendorStatusDto,
  UpdateVendorProfileDto,
  VendorUpdateDto,
} from './dto/update-vendor.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('Admin')
@Controller('admin')
@ApiSecurity('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/offer-redemption-stats')
  async adminRedeemedOfferStats() {
    return this.adminService.adminRedeemedOfferStats();
  }

  @Get('/offer-type-distribution')
  async offerTypeDistribution() {
    return this.adminService.offerTypeDistribution();
  }

  @Get('export-redemption-trends')
  @ApiOperation({ summary: 'Export redemption trends to CSV' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
  async exportRedemptionTrendsToCsv(
    @Res() res: Response,
    @Query('year') year?: number,
  ) {
    // 1️⃣ Generate CSV from service
    const csv = await this.adminService.exportRedemptionTrendsToCsv(year);

    // 2️⃣ Set response headers to trigger download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="redemption_trends_${year || 'all'}.csv"`,
    );

    // 3️⃣ Send CSV content
    res.send(csv);
  }

  @Get('export-vendor-performance')
  @ApiOperation({ summary: 'Export vendor performance to CSV' })
  async exportVendorPerformanceToCsv(@Res() res: Response) {
    // 1️⃣ Generate CSV from service
    const csv = await this.adminService.exportVendorPerformanceToCsv();

    // 2️⃣ Set response headers to trigger download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="vendor_performance.csv"',
    );

    // 3️⃣ Send CSV content
    res.send(csv);
  }

  @Get('/top-performing-vendors')
  @ApiOperation({ summary: 'Get top performing vendors' })
  async getTopPerformingVendors() {
    return this.adminService.getTopPerformingVendors();
  }

  @Get('/offer-redeem-chart')
  @ApiOperation({
    summary: 'Get offer redeem chart, empty year return current year',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
  async offerRedeemChart(@Query('year') year?: number) {
    return this.adminService.offerRedeemChart(year);
  }

  @Get('dashboard/status')
  @ApiOperation({ summary: 'Get dashboard status' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard status retrieved successfully',
  })
  dashboardStatus() {
    return this.adminService.dashboardStatus();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get admin profile' })
  @ApiResponse({
    status: 200,
    description: 'Admin profile retrieved successfully',
  })
  getProfile(@CurrentUser() user: any) {
    return this.adminService.getProfile(user.id);
  }

  @Get('users/status')
  @ApiOperation({ summary: 'Get users status' })
  @ApiResponse({
    status: 200,
    description: 'Users status retrieved successfully',
  })
  usersStatus() {
    return this.adminService.usersStatus();
  }

  @Get('users')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by email or name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  allUsers(
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminService.allUsers(search, parseInt(page), parseInt(limit));
  }

  @Patch('suspend-user/:id')
  @ApiOperation({ summary: 'Suspend a user by ID' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Delete('user/:id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Search vendors' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by email or name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  allVendors(
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminService.allVendors(
      search,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Patch('vendor/:id/approve')
  @ApiOperation({ summary: 'Approve a vendor by ID' })
  @ApiResponse({ status: 200, description: 'Vendor approved successfully' })
  approvedVendor(@Param('id') id: string) {
    return this.adminService.approvedVendor(id);
  }

  @Patch('vendor/:id')
  @ApiOperation({ summary: 'Update a vendor by ID' })
  @ApiResponse({ status: 200, description: 'vendor update successfully' })
  updateVendor(
    @Param('id') id: string,
    @Body() updateData: UpdateVendorProfileDto,
  ) {
    return this.adminService.updateVendor(id, updateData);
  }

  @Delete('vendor/:id')
  @ApiOperation({ summary: 'Delete a vendor by ID' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  deleteVendor(@Param('id') id: string) {
    return this.adminService.deleteVendor(id);
  }

  @Patch('/status/:id')
  @ApiOperation({ summary: 'Change offer status by ID, only for admin' })
  @ApiResponse({
    status: 200,
    description: 'Offer status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiBody({
    type: ChangeVendorStatusDto,
    description: 'Optional status to update',
  })
  changeOfferStatus(
    @Param('id') id: string,
    @Body() dto: ChangeVendorStatusDto,
  ) {
    return this.adminService.changeOfferStatus(id, dto.status);
  }
}
