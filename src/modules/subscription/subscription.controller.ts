import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import {
  FreeSubscriptionDto,
  SubscriptionCheckoutDto,
} from './dto/subscription.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiBearerAuth('JWT')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // @UseGuards(JwtAuthGuard)
  // @Post('book/:planId')
  // @ApiOperation({
  //   summary: 'Book subscription',
  // })
  // async bookSubscription(
  //   @CurrentUser() user: User,
  //   @Param('planId') planId: string,
  // ) {
  //   return this.subscriptionService.bookSubscription(user.id, planId);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post('checkout/:paymentId')
  // @ApiOperation({
  //   summary: 'Initiate NestPay checkout for a subscription payment',
  // })
  // async checkoutSubscription(
  //   @CurrentUser() user: User,
  //   @Param('paymentId') paymentId: string,
  // ) {
  //   return this.subscriptionService.checkoutPayment(paymentId, user.id);
  // }

  @Post('free')
  @ApiOperation({
    summary: 'Grant a free subscription to a user (admin only)',
  })
  async giveFreeSubscription(@Body() payload: FreeSubscriptionDto) {
    return this.subscriptionService.giveFreeSubscription(payload);
  }

  @Post('subscribe/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Subscribe to a plan',
  })
  async subscribe(
    @CurrentUser() user: User,
    @Body() payload: SubscriptionCheckoutDto,
  ) {
    return this.subscriptionService.subscribeAndCheckout(user.id, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('checkout/:paymentId/form')
  @ApiOperation({
    summary: 'Get auto-submit HTML form for NestPay checkout',
  })
  async getCheckoutForm(
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    const html = await this.subscriptionService.generateCheckoutForm(paymentId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Post('payment/callback')
  @ApiOperation({
    summary: 'NestPay callback endpoint (public)',
  })
  async paymentCallback(@Body() payload: Record<string, string>) {
    return this.subscriptionService.handlePaymentCallback(payload);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get subscription dashboard data (admin only)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDashboardData() {
    return this.subscriptionService.getSubscriptionDashboardData();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get subscription history (user only)',
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'premium',
    description: 'Search by subscription plan name or description',
  })
  async getSubscriptionHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.subscriptionService.getMySubscriptionHistory(
      user.id,
      Number(page) || 1,
      Number(limit) || 10,
      search,
    );
  }
}
