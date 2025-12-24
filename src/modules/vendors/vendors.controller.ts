import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  ParseIntPipe,
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
import {
  ImageUploadResponseDto,
  UploadImageDto,
} from '../users/dto/upload-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  imageFileFilter,
  vendorLogoStorage,
} from 'src/common/utils/file-upload.utils';
import { FileSizeInterceptor } from 'src/common/interceptors/file-size.interceptor';

@Controller('vendors')
@ApiSecurity('JWT') // Apply JWT security scheme to all endpoints in this controller
@UseGuards(JwtAuthGuard) // All routes require authentication
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Patch('/upload-logo')
  @ApiOperation({ summary: 'Upload user profile image, vendor only' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: vendorLogoStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadLogo(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vendorsService.uploadLogo(user.id, file);
  }

  @Get()
  // Anyone authenticated can see vendor list
  findAll() {
    return this.vendorsService.findAll();
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
  @ApiBody({
    description: 'Fields that can be updated for the vendor profile',
    schema: {
      type: 'object',
      properties: {
        businessName: { type: 'string', example: 'My Business' },
        contactEmail: { type: 'string', example: 'vendor@example.com' },
        phone: { type: 'string', example: '+1234567890' },
        streetAddress: { type: 'string', example: '123 Main St' },
        city: { type: 'string', example: 'New York' },
      },
      required: [],
    },
  })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body()
    updateData: {
      businessName?: string;
      contactEmail?: string;
      phone?: string;
      streetAddress?: string;
      city?: string;
    },
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
  @ApiBody({
    description: 'Fields that can be updated for a vendor profile',
    schema: {
      type: 'object',
      properties: {
        businessName: { type: 'string', example: 'My Business' },
        contactEmail: { type: 'string', example: 'vendor@example.com' },
        phone: { type: 'string', example: '+1234567890' },
        streetAddress: { type: 'string', example: '123 Main St' },
        city: { type: 'string', example: 'New York' },
      },
      required: [],
    },
  })
  updateProfile(
    @Param('id') id: string,
    @Body()
    updateData: {
      businessName?: string;
      contactEmail?: string;
      phone?: string;
      streetAddress?: string;
      city?: string;
    },
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
  getMyOffers(@CurrentUser() user: any) {
    return this.vendorsService.getAllMyOffers(user.id);
  }

  @Get('/dashboard')
  @ApiQuery({
    name: 'from',
    type: String,
    required: false,
    example: '2023-01-01',
    description: 'Start date for the dashboard (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to',
    type: String,
    required: false,
    example: '2023-12-31',
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
  getOffersUsageHistory(@CurrentUser() user: any) {
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
