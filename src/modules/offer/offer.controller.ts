import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import {
  CreateOfferDto,
  GetOffersQueryDto,
  GetVendorOffersQueryDto,
  RedeemOfferDto,
  UpdateOfferStatusDto,
} from './dto/offer.dto';
import { ApiParam } from '@nestjs/swagger';


// TODO : add auth guard

@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post('/create')
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.createOffer(createOfferDto);
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

  @Get()
  getAllOffers(@Query() query: GetOffersQueryDto) {
    return this.offerService.getAllOffers(query);
  }

  @Patch('/:id/update-status')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the offer to update status',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOfferStatusDto) {
    return this.offerService.updateStatus(id, dto.status);
  }

  @Get('/vendor/:vendorId')
  @ApiParam({
    name: 'vendorId',
    type: String,
    description: 'The ID of the vendor whose offers to retrieve',
  })
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

  @Post('/redeem')
  redeemOffer(@Body() payload: RedeemOfferDto) {
    return this.offerService.redeemOffer(payload);
  }
}
