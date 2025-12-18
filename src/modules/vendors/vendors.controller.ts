import { Controller, Get, Param, Patch, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('vendors')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  // Anyone authenticated can see vendor list
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR) // Only vendors can access their own profile
  getMyProfile(@CurrentUser() user: any) {
    return this.vendorsService.findOne(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  @Patch('me/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR) // Only vendors can update their own profile
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateData: {
      businessName?: string;
      businessAddress?: string;
      phoneNumber?: string;
      taxId?: string;
      description?: string;
    },
  ) {
    return this.vendorsService.updateVendorProfile(user.id, updateData);
  }

  @Patch(':id/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can update any vendor profile
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: {
      businessName?: string;
      businessAddress?: string;
      phoneNumber?: string;
      taxId?: string;
      description?: string;
    },
  ) {
    return this.vendorsService.updateVendorProfile(id, updateData);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can verify vendors
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.verifyVendor(id);
  }
}
