import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto, UpdateOfferStatusDto } from './dto/offer.dto';
import { ApiParam } from '@nestjs/swagger';

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
  getAllOffers() {
    return this.offerService.getAllOffers();
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
}
