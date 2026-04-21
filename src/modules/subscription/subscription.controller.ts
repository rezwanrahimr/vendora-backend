import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth('JWT')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('book/:planId')
  @ApiOperation({
    summary: 'Book subscription',
  })
  async bookSubscription(
    @CurrentUser() user: User,
    @Param('planId') planId: string,
  ) {
    return this.subscriptionService.bookSubscription(user.id, planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout/:paymentId')
  @ApiOperation({
    summary: 'Initiate NestPay checkout for a subscription payment',
  })
  async checkoutSubscription(
    @CurrentUser() user: User,
    @Param('paymentId') paymentId: string,
  ) {
    return this.subscriptionService.checkoutPayment(paymentId, user.id);
  }

  @Post('payment/callback')
  @ApiOperation({
    summary: 'NestPay callback endpoint (public)',
  })
  async paymentCallback(@Body() payload: Record<string, string>) {
    return this.subscriptionService.handlePaymentCallback(payload);
  }
}
