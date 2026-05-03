import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ImageUploadResponseDto } from '../users/dto/upload-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';


import { UpdateVendorProfileDto } from './vendor.dto';
import { UploadSingleImage } from 'src/common/upload-files/decorators/upload-file.decorator';
import { User } from '@prisma/client';

@Controller('vendors')
@ApiSecurity('JWT') // Apply JWT security scheme to all endpoints in this controller
@UseGuards(JwtAuthGuard) // All routes require authentication
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Patch('/upload-logo')
  @ApiOperation({ summary: 'Upload vendor logo, vendor only' })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  // @UseInterceptors(
  //   FileInterceptor('image', {
  //     storage: vendorLogoStorage,
  //     fileFilter: imageFileFilter,
  //   }),
  //   FileSizeInterceptor,
  // )
  @UploadSingleImage('image')
  async uploadLogo(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vendorsService.uploadLogo(user.id, file);
  }

  @Patch('/upload-logo/:id')
  @ApiOperation({ summary: 'Upload  vendor logo, admin only' })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiParam({ name: 'id', type: 'string', description: 'Vendor user ID' })
  @Roles(UserRole.ADMIN)
  @UploadSingleImage("image")
  @UseGuards(RolesGuard)
  async uploadLogoByAdmin(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vendorsService.uploadLogo(id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get vendor list (search & pagination supported)' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search by vendor name, email, business name, city, or category',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vendors',
  })
  // Anyone authenticated can see vendor list
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vendorsService.findAll({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR) // Only vendors can access their own profile
  @ApiOperation({ summary: 'Get current vendor profile' })
  getMyProfile(@CurrentUser() user: any) {
    return this.vendorsService.findOne(user.id);
  }

  @Patch('me/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update current vendor profile' })
  @ApiBody({ type: UpdateVendorProfileDto })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateData: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateVendorProfile(user.id, updateData);
  }

  @Patch(':id/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update any vendor profile (admin only)' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Vendor user ID to update',
  })
  @ApiBody({ type: UpdateVendorProfileDto })
  updateProfile(
    @Param('id') id: string,
    @Body() updateData: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateVendorProfile(id, updateData);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can verify vendors
  @ApiOperation({ summary: 'Verify a vendor profile (admin only)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Vendor user ID to verify',
  })
  verify(@Param('id') id: string) {
    return this.vendorsService.verifyVendor(id);
  }

  @Get('/my-offers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get my offers as a vendor' })
  getMyOffers(@CurrentUser() user: any) {
    return this.vendorsService.getAllMyOffers(user.id);
  }

  @Get('/dashboard')
  @ApiQuery({
    name: 'from',
    type: String,
    required: false,
    example: '2025-01-01',
    description: 'Start date for the dashboard (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to',
    type: String,
    required: false,
    example: '2025-12-31',
    description: 'End date for the dashboard (YYYY-MM-DD)',
  })
  getVendorDashboard(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const options = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };

    return this.vendorsService.getVendorDashboard(user.id, options);
  }

  @Get('statistics')
@ApiOperation({ summary: 'Get offers usage history for current vendor'  })
  getOffersUsageHistory(@CurrentUser() user: User) {
    return this.vendorsService.getOffersUsageHistory(user.id);
  }

  @Get('/export-to-csv')
  async exportToCSV(@CurrentUser() user: any, @Res() res: Response) {
    const csv = await this.vendorsService.exportToCsv(user.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="offers-performance.csv"`,
    );

    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a vendor by user ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }
}
