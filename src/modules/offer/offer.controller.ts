import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CreateOfferDto,
  GetOffersQueryDto,
  GetVendorOffersQueryDto,
  RedeemOfferDto,
  UpdateOfferStatusDto,
} from './dto/offer.dto';
import { OfferService } from './offer.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';



@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  // STATIC ROUTES FIRST
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('/create')
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.createOffer(createOfferDto);
  }

  @Get()
  getAllOffers(@Query() query: GetOffersQueryDto) {
    return this.offerService.getAllOffers(query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/:id/update-status')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the offer to update status',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOfferStatusDto) {
    return this.offerService.updateStatus(id, dto.status);
  }

  @Post('/redeem')
  redeemOffer(@Body() payload: RedeemOfferDto) {
    return this.offerService.redeemOffer(payload);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @Get('/quick-stats')
  getQuickStatsForVendor(@CurrentUser() user: any) {
    return this.offerService.getQuickStatsForVendor(user.id);
  }

  // PARAMETERIZED ROUTES LAST
  @Get('/vendor/:vendorId')
  @ApiParam({
    name: 'vendorId',
    type: String,
    description: 'The ID of the vendor whose offers to retrieve',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  getOffersForVendor(
    @Param('vendorId') vendorId: string,
    @Query() query: GetVendorOffersQueryDto,
  ) {
    return this.offerService.getOfferForVendor(vendorId, query);
  }

  @Patch('/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the offer to update',
  })
  updateOffer(@Param('id') id: string, @Body() data: Partial<CreateOfferDto>) {
    return this.offerService.updateOffer(id, data);
  }

  @Delete('/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the offer to delete',
  })
  deleteOffer(@Param('id') id: string) {
    return this.offerService.deleteOffer(id);
  }

  @Get('/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the offer to retrieve',
  })
  getOfferById(@Param('id') id: string) {
    return this.offerService.getOfferById(id);
  }
}
