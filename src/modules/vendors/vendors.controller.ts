import { Controller, Get, Param, Patch, Body, ParseIntPipe } from '@nestjs/common';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id/profile')
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
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.verifyVendor(id);
  }
}
