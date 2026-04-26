import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { SubscriptionCheckoutDto } from './dto/subscription.dto';

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

  @Post('subscribe/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Subscribe to a plan',
  })
  async subscribe(
    @CurrentUser() user: User,
    @Body() payload: SubscriptionCheckoutDto,
  ) {
    return this.subscriptionService.subscribeAndCheckout(
      user.id,
      payload.subscriptionPlanId,
      payload.idempotencyKey,
    );
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
}
