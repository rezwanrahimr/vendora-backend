import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PromoCodeStatus } from '@prisma/client';

@ApiBearerAuth('JWT')
@Controller('promo-code')
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new promo code (Admin only)',
    description:
      'Allows an admin to create a new promotional discount code with usage limits and expiry date.',
  })
  async createPromoCode(@Body() payload: CreatePromoCodeDto) {
    return this.promoCodeService.createPromoCode(payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all promotional discount codes (Admin only)',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PromoCodeStatus,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'usedCount', 'expiryDate'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  async getAllPromoCodes(
    @Query('search') search?: string,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,

    @Query('status') status?: PromoCodeStatus,

    @Query('sortBy') sortBy?: 'createdAt' | 'usedCount' | 'expiryDate',

    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.promoCodeService.getAllPromoCodes(
      search,
      page,
      limit,
      { status },
      sortBy,
      sortOrder,
    );
  }

  @Get('code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({
    name: 'code',
    required: true,
    type: String,
    description: 'Unique promo code to retrieve',
  })
  @ApiOperation({
    summary: 'Get a promo code by its code (Admin only)',
    description:
      'Allows an admin to retrieve details of a specific promo code using its unique code.',
  })
  async getPromoCode(@Query('code') code: string) {
    return this.promoCodeService.getPromoCode(code);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a promo code (Admin only)',
    description:
      'Allows an admin to update the details of an existing promo code.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Unique ID of the promo code to update',
  })
  async updatePromoCode(
    @Body() payload: UpdatePromoCodeDto,
    @Query('id') id: string,
  ) {
    return this.promoCodeService.updatePromoCode(id, payload);
  }
}
