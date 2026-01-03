import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CreateOfferDto,
  GenerateQrCodeDto,
  GetOfferByCategoryIdDto,
  GetOffersQueryDto,
  GetVendorOffersQueryDto,
  RedeemOfferDto,
  UpdateOfferDto,
  UpdateOfferStatusDto,
} from './dto/offer.dto';
import { OfferService } from './offer.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeInterceptor } from 'src/common/interceptors/file-size.interceptor';
import {
  imageFileFilter,
  offerImageStorage,
} from 'src/common/utils/file-upload.utils';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@Controller('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Get('/my-redeemed-offers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'OK' })
  getMyRedeemedOffersWithSavings(@CurrentUser() user: any) {
    return this.offerService.getMyRedeemedOffersWithSavings(user.id);
  }

  // STATIC ROUTES FIRST
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an offer, requires admin' })
  @Post('/create')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: offerImageStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  create(
    @Body() createOfferDto: CreateOfferDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.offerService.createOffer(createOfferDto, file);
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

  @Post('qr-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Generate a QR code for an offer',
    description:
      'Generates a one-time QR code for the specified offer. Only the authenticated user who owns the offer can generate a QR code.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
    schema: {
      example: { token: '9fK2LxQmE8pA7Z0wYdN4R' },
    },
  })
  @ApiResponse({ status: 400, description: 'Offer is not active or invalid' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({
    status: 409,
    description: 'Unable to generate QR code at this time',
  })
  generateQRCode(@Body() payload: GenerateQrCodeDto, @CurrentUser() user: any) {
    return this.offerService.generateQRCode(payload, user.id);
  }

  @Post('/redeem')
  @ApiOperation({ summary: 'Redeem an offer using a QR code, vendor only' })
  @ApiResponse({
    status: 201,
    description: 'Offer redeemed successfully',
    schema: {
      example: {
        offer: {
          id: 'offer-id',
          title: '20% Off Pizza',
          redemptionCount: 1,
          maxRedemptions: 5,
        },
        redeemedAt: '2026-01-03T10:00:00.000Z',
        vendor: { id: 'vendor-id', name: 'Pizza Hub' },
        redeemer: { id: 'customer-id', name: 'John Doe' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid QR code or offer conditions not met',
  })
  @ApiResponse({ status: 404, description: 'QR code or customer not found' })
  redeemOffer(@Body() payload: RedeemOfferDto, @CurrentUser() user: any) {
    return this.offerService.redeemOffer(payload, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @Get('/quick-stats')
  @ApiOperation({ summary: 'Get quick stats current vendor' })
  getQuickStatsForVendor(@CurrentUser() user: any) {
    return this.offerService.getQuickStatsForVendor(user.id);
  }

  @Get('newest')
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNewestOffers(@Query() query: GetOfferByCategoryIdDto) {
    return this.offerService.getNewestOffers(query.categoryId, query.limit);
  }

  @Get('trending')
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTrendingOffers(@Query() query: GetOfferByCategoryIdDto) {
    return this.offerService.getTrendingOffers(query.categoryId, query.limit);
  }

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

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an offer, requires admin' })
  @Patch('/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Offer ID to update',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: offerImageStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  @ApiResponse({
    status: 200,
    description: 'Offer updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.offerService.updateOffer(id, updateOfferDto, file);
  }

  @Delete('/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the offer to delete',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
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
