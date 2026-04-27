import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  SubscriptionPaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma.service';
import {
  FreeSubscriptionDto,
  SubscriptionCheckoutDto,
} from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  //TODO:  later will add coupon code and other features
  // async bookSubscription(userId: string, planId: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user || user.isDeleted) {
  //     throw new NotFoundException('User not found');
  //   }

  //   if (user.status !== 'ACTIVE') {
  //     throw new BadRequestException('User is not active');
  //   }

  //   const plan = await this.prisma.subscriptionPlan.findUnique({
  //     where: { id: planId },
  //   });

  //   if (!plan) {
  //     throw new NotFoundException('Subscription plan not found');
  //   }

  //   if (!plan.isActive) {
  //     throw new BadRequestException('Subscription plan is not active');
  //   }

  //   const now = new Date();

  //   // 🚨 Prevent multiple active subscriptions
  //   const existingActive = await this.prisma.subscription.findFirst({
  //     where: {
  //       userId,
  //       status: 'ACTIVE',
  //       endDate: { gt: now },
  //     },
  //   });

  //   if (existingActive) {
  //     throw new BadRequestException('User already has an active subscription');
  //   }

  //   const subscriptionEnd = new Date(
  //     now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
  //   );

  //   return this.prisma.$transaction(async (tx) => {
  //     // 1. Create subscription (PENDING)
  //     const subscription = await tx.subscription.create({
  //       data: {
  //         userId,
  //         planId,
  //         price: plan.price,
  //         finalPrice: plan.price,
  //         discountAmount: 0,
  //         startDate: now,
  //         endDate: subscriptionEnd,
  //         status: 'PENDING',
  //         paymentStatus: 'PENDING',
  //       },
  //     });

  //     // 2. Create payment (PENDING)
  //     const payment = await tx.payment.create({
  //       data: {
  //         amount: plan.price,
  //         provider: 'NESTPAY',
  //         status: 'PENDING',
  //         subscriptionId: subscription.id,
  //         userId,
  //       },
  //     });

  //     return {
  //       subscription,
  //       payment,
  //     };
  //   });
  // }

  // async checkoutPayment(paymentId: string, userId: string) {
  //   const payment = await this.prisma.payment.findUnique({
  //     where: { id: paymentId },
  //     include: {
  //       Subscription: true,
  //     },
  //   });

  //   if (!payment) {
  //     throw new NotFoundException('Payment not found');
  //   }

  //   if (payment.Subscription.userId !== userId) {
  //     throw new BadRequestException('Unauthorized payment access');
  //   }

  //   if (payment.status === 'COMPLETED') {
  //     return {
  //       message: 'Payment already completed',
  //       paymentId,
  //       status: payment.status,
  //     };
  //   }

  //   const nestpay = this.getNestpayConfig();
  //   const oid = payment.id;
  //   const rnd = randomBytes(16).toString('hex').toUpperCase();
  //   const amount = this.formatAmountForGateway(payment.amount);

  //   const hash = this.generateNestpayRequestHash({
  //     clientId: nestpay.clientId,
  //     oid,
  //     amount,
  //     okUrl: nestpay.okUrl,
  //     failUrl: nestpay.failUrl,
  //     trantype: nestpay.trantype,
  //     rnd,
  //     currency: nestpay.currency,
  //     storeKey: nestpay.storeKey,
  //   });

  //   const existingMetadata = this.asObject(payment.metadata);

  //   await this.prisma.payment.update({
  //     where: { id: paymentId },
  //     data: {
  //       status: 'PENDING',
  //       metadata: {
  //         ...existingMetadata,
  //         nestpay: {
  //           ...this.asObject(existingMetadata.nestpay),
  //           lastInitAt: new Date().toISOString(),
  //           oid,
  //           rnd,
  //           amount,
  //           gatewayUrl: nestpay.gatewayUrl,
  //         },
  //       },
  //     },
  //   });

  //   return {
  //     message: 'NestPay checkout initialized successfully',
  //     paymentId,
  //     method: 'POST',
  //     actionUrl: nestpay.gatewayUrl,
  //     fields: {
  //       currency: nestpay.currency,
  //       trantype: nestpay.trantype,
  //       okUrl: nestpay.okUrl,
  //       failUrl: nestpay.failUrl,
  //       amount,
  //       oid,
  //       clientid: nestpay.clientId,
  //       storetype: nestpay.storetype,
  //       lang: nestpay.lang,
  //       hashAlgorithm: 'ver2',
  //       rnd,
  //       encoding: nestpay.encoding,
  //       hash,
  //     },
  //   };
  // }

  async giveFreeSubscription(payload: FreeSubscriptionDto) {
    const user = await this.validateUser(payload.userId);
    const plan = await this.validatePlan(payload.planId);

    const now = new Date();

    const startDate = payload.subscriptionStartDate
      ? new Date(payload.subscriptionStartDate)
      : now;

    const endDate = new Date(
      startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      // 🔒 Single optimized check (active OR free OR scheduled)
      const existing = await tx.subscription.findFirst({
        where: {
          userId: user.id,
          OR: [
            {
              status: 'ACTIVE',
              endDate: { gt: now },
            },
            {
              isFree: true,
              status: {
                in: ['ACTIVE', 'PENDING'],
              },
            },
            {
              status: 'PENDING',
            },
          ],
        },
      });

      if (existing) {
        throw new BadRequestException(
          'User already has an active or scheduled subscription',
        );
      }

      const status =
        startDate > now
          ? SubscriptionStatus.PENDING
          : SubscriptionStatus.ACTIVE;

      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,

          price: 0,
          finalPrice: 0,
          discountAmount: null,

          startDate,
          endDate,

          status,
          paymentStatus: SubscriptionPaymentStatus.NOT_REQUIRED,

          freeReason: payload.freeReason,
          isFree: true,
        },
      });

      // ⚠️ better to treat as derived state
      await tx.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: true,
        },
      });

      return subscription;
    });
  }

  private getNestpayConfig() {
    const gatewayUrl = this.configService.get<string>('nestpay.gatewayUrl');
    const clientId = this.configService.get<string>('nestpay.clientId');
    const storeKey = this.configService.get<string>('nestpay.storeKey');
    const okUrl = this.configService.get<string>('nestpay.okUrl');
    const failUrl = this.configService.get<string>('nestpay.failUrl');

    if (!gatewayUrl || !clientId || !storeKey || !okUrl || !failUrl) {
      throw new BadRequestException(
        'NestPay configuration is incomplete. Please set gatewayUrl, clientId, storeKey, okUrl, and failUrl.',
      );
    }

    return {
      gatewayUrl,
      clientId,
      storeKey,
      okUrl,
      failUrl,
      currency: this.configService.get<string>('nestpay.currency') || '941',
      trantype: this.configService.get<string>('nestpay.trantype') || 'PreAuth',
      storetype:
        this.configService.get<string>('nestpay.storetype') || '3d_pay_hosting',
      lang: this.configService.get<string>('nestpay.lang') || 'sr',
      encoding: this.configService.get<string>('nestpay.encoding') || 'utf-8',
    };
  }

  private formatAmountForGateway(amount: unknown): string {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      throw new BadRequestException('Invalid payment amount');
    }
    return numericAmount.toFixed(2);
  }

  private generateNestpayRequestHash(input: {
    clientId: string;
    oid: string;
    amount: string;
    okUrl: string;
    failUrl: string;
    trantype: string;
    rnd: string;
    currency: string;
    storeKey: string;
  }): string {
    const hashSource =
      `${input.clientId}|${input.oid}|${input.amount}|${input.okUrl}|` +
      `${input.failUrl}|${input.trantype}||${input.rnd}||||${input.currency}|${input.storeKey}`;

    return createHash('sha512').update(hashSource, 'utf8').digest('base64');
  }

  private verifyCallbackHash(
    payload: Record<string, string>,
    storeKey: string,
  ): { isValid: boolean; reason: string } {
    const incomingHash = payload.HASH || payload.hash;
    if (!incomingHash) {
      return {
        isValid: false,
        reason: 'Missing HASH in callback payload',
      };
    }

    const hashParamsVal = payload.HASHPARAMSVAL || payload.hashparamsval;
    if (!hashParamsVal) {
      return {
        isValid: true,
        reason: 'HASHPARAMSVAL not provided; skipped strict hash verification',
      };
    }

    const expectedHash = createHash('sha512')
      .update(`${hashParamsVal}${storeKey}`, 'utf8')
      .digest('base64');

    return {
      isValid: incomingHash === expectedHash,
      reason:
        incomingHash === expectedHash
          ? 'Callback hash matched'
          : 'Callback hash mismatch',
    };
  }

  private asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('User is not active');
    }

    return user;
  }

  private async validatePlan(planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Subscription plan is not active');
    }

    return plan;
  }

  private async assertNoActiveSubscription(userId: string) {
    const now = new Date();

    const existing = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: now },
      },
    });

    if (existing) {
      throw new BadRequestException('User already has an active subscription');
    }
  }

  private async getOrCreatePayment(
    user: User,
    plan: SubscriptionPlan,
    idempotencyKey: string,
    promoCode?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Idempotency check
      const existing = await tx.payment.findFirst({
        where: { idempotencyKey },
      });

      if (existing) {
        return existing;
      }

      const now = new Date();

      const subscriptionEnd = new Date(
        now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
      );

      let finalPrice: Prisma.Decimal = plan.price;
      let discountAmount = new Prisma.Decimal(0);

      let promoResult: {
        promoCodeId: string;
        finalPrice: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
      } | null = null;

      // 2. Apply promo (CALC ONLY)
      if (promoCode) {
        promoResult = await this.applyPromoCode(
          tx,
          plan.price.toNumber(),
          promoCode,
          user.id,
        );

        if (!promoResult) {
          throw new BadRequestException('Invalid promo code');
        }

        finalPrice = promoResult.finalPrice;
        discountAmount = promoResult.discountAmount;
      } else {
        console.log(`[PAYMENT] No promo code provided`);
      }

      // 3. Create subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          price: plan.price,
          finalPrice,
          discountAmount,
          startDate: now,
          discountType: promoResult ? 'PERCENTAGE' : null,
          endDate: subscriptionEnd,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // 4. Promo usage (ONLY HERE)
      if (promoResult) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoResult.promoCodeId,
            userId: user.id,
            subscriptionId: subscription.id,
            discountAmount,
          },
        });

        await tx.promoCode.update({
          where: { id: promoResult.promoCodeId },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      // 5. Create payment
      const payment = await tx.payment.create({
        data: {
          amount: finalPrice,
          provider: 'NESTPAY',
          status: 'PENDING',
          userId: user.id,
          subscriptionId: subscription.id,
          metadata: {
            subscriptionId: subscription.id,
            price: plan.price,
            planId: plan.id,
            userId: user.id,
          },
          idempotencyKey,
        },
      });

      return payment;
    });
  }

  private async buildCheckout(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { Subscription: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const nestpay = this.getNestpayConfig();

    const oid = payment.id;
    const rnd = randomBytes(16).toString('hex').toUpperCase();
    const amount = this.formatAmountForGateway(payment.amount);

    const hash = this.generateNestpayRequestHash({
      clientId: nestpay.clientId,
      oid,
      amount,
      okUrl: nestpay.okUrl,
      failUrl: nestpay.failUrl,
      trantype: nestpay.trantype,
      rnd,
      currency: nestpay.currency,
      storeKey: nestpay.storeKey,
    });

    const existingMetadata = this.asObject(payment.metadata);

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PENDING',
        metadata: {
          ...existingMetadata,
          nestpay: {
            ...this.asObject(existingMetadata.nestpay),
            lastInitAt: new Date().toISOString(),
            oid,
            rnd,
            amount,
            gatewayUrl: nestpay.gatewayUrl,
          },
        },
      },
    });

    return {
      actionUrl: nestpay.gatewayUrl,
      fields: {
        currency: nestpay.currency,
        trantype: nestpay.trantype,
        okUrl: nestpay.okUrl,
        failUrl: nestpay.failUrl,
        amount,
        oid,
        clientid: nestpay.clientId,
        storetype: nestpay.storetype,
        lang: nestpay.lang,
        hashAlgorithm: 'ver2',
        rnd,
        encoding: nestpay.encoding,
        hash,
      },
    };
  }

  private async applyPromoCode(
    tx: Prisma.TransactionClient,
    originalPrice: number,
    code: string,
    userId: string,
  ) {
    const normalizedCode = code.trim().toUpperCase();

    const promoCode = await tx.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    if (promoCode.status !== 'ACTIVE') {
      throw new BadRequestException('Promo code is not active');
    }

    if (promoCode.expiryDate < new Date()) {
      throw new BadRequestException('Promo code has expired');
    }

    // ✅ usage count check (DB-safe)
    const usageCount = await tx.promoCodeUsage.count({
      where: { promoCodeId: promoCode.id },
    });

    if (promoCode.maxUsages && usageCount >= promoCode.maxUsages) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    // ✅ prevent duplicate usage per user (DB-safe)
    const alreadyUsed = await tx.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId,
        },
      },
    });

    if (alreadyUsed) {
      throw new BadRequestException('You already used this promo code');
    }

    // ✅ Decimal-safe calculation
    const discount = new Prisma.Decimal(promoCode.discountPercentage ?? 0)
      .div(100)
      .mul(originalPrice);

    const finalPrice = new Prisma.Decimal(originalPrice).minus(discount);

    return {
      promoCodeId: promoCode.id,
      finalPrice,
      discountAmount: discount,
    };
  }

  async subscribeAndCheckout(userId: string, payload: SubscriptionCheckoutDto) {
    const { subscriptionPlanId, idempotencyKey } = payload;

    const user = await this.validateUser(userId);
    const plan = await this.validatePlan(subscriptionPlanId);

    await this.assertNoActiveSubscription(userId);

    const payment = await this.getOrCreatePayment(
      user,
      plan,
      idempotencyKey,
      payload.promoCode,
    );

    const checkout = await this.buildCheckout(payment.id);

    return {
      subscriptionId: payment.subscriptionId,
      paymentId: payment.id,
      checkout,
    };
  }

  async generateCheckoutForm(paymentId: string): Promise<string> {
    const checkoutData = await this.buildCheckout(paymentId);
    const fields = checkoutData.fields as Record<string, string>;
    const actionUrl = checkoutData.actionUrl;

    let formHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Processing</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 {
            color: #333;
            margin: 0 0 10px;
        }
        p {
            color: #666;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Processing Payment</h2>
        <p>Redirecting to payment gateway...</p>
    </div>

    <form id="paymentForm" method="POST" action="${actionUrl}" style="display:none;">`;

    // Add all hidden fields
    for (const [key, value] of Object.entries(fields)) {
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      formHtml += `
        <input type="hidden" name="${key}" value="${escapedValue}" />`;
    }

    formHtml += `
    </form>

    <script>
        // Auto-submit the form when page loads
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('paymentForm').submit();
        });
        
        // Fallback: submit after 1 second if JS is slow
        setTimeout(function() {
            const form = document.getElementById('paymentForm');
            if (form && !form.submitted) {
                form.submit();
            }
        }, 1000);
    </script>
</body>
</html>`;

    return formHtml;
  }

  async handlePaymentCallback(payload: Record<string, string>) {
    const oid = payload.oid || payload.Oid;
    if (!oid) {
      throw new BadRequestException('Missing oid in callback payload');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: oid },
      include: {
        Subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for callback oid');
    }

    if (payment.status === 'COMPLETED') {
      return {
        message: 'Payment already processed',
        paymentId: payment.id,
        subscriptionId: payment.subscriptionId,
        status: payment.status,
      };
    }

    const nestpay = this.getNestpayConfig();
    const mdStatus = String(payload.mdStatus || payload.MDStatus || '');
    const procReturnCode = String(
      payload.ProcReturnCode || payload.procreturncode || '',
    );
    const response = String(payload.Response || payload.response || '');

    const isMdStatusOk = ['1', '2', '3', '4'].includes(mdStatus);
    const isProcReturnOk = procReturnCode === '00';
    const isResponseApproved =
      response.length === 0 || response.toLowerCase() === 'approved';

    const hashValidation = this.verifyCallbackHash(payload, nestpay.storeKey);
    const isSuccess =
      isMdStatusOk &&
      isProcReturnOk &&
      isResponseApproved &&
      hashValidation.isValid;

    const existingMetadata = this.asObject(payment.metadata);

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? 'COMPLETED' : 'FAILED',
          providerTransactionId:
            payload.TransId || payload.transid || payment.providerTransactionId,
          metadata: {
            ...existingMetadata,
            nestpay: {
              ...this.asObject(existingMetadata.nestpay),
              lastCallbackAt: new Date().toISOString(),
              callbackPayload: payload,
              callbackValidation: {
                isMdStatusOk,
                isProcReturnOk,
                isResponseApproved,
                hashValidation,
              },
            },
          },
        },
      });

      if (isSuccess) {
        await tx.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'ACTIVE',
            paymentStatus: 'COMPLETED',
          },
        });

        await tx.user.update({
          where: { id: payment.userId },
          data: {
            isSubscribed: true,
          },
        });
      }

      return {
        message: isSuccess
          ? 'Payment verified and subscription activated'
          : 'Payment verification failed',
        paymentId: payment.id,
        subscriptionId: payment.subscriptionId,
        status: isSuccess ? 'COMPLETED' : 'FAILED',
      };
    });
  }

  async getSubscriptionDashboardData() {
    const [
      totalActiveSubscriptions,
      totalActivePromoCodes,
      totalActiveFreeSubscriptions,
    ] = await Promise.all([
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.promoCode.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', isFree: true },
      }),
    ]);

    return {
      totalActiveSubscriptions,
      totalActivePromoCodes,
      totalActiveFreeSubscriptions,
    };
  }

  async getMySubscriptionHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {



limit = Math.min(100, Math.max(1, limit));

    const where: Prisma.SubscriptionWhereInput = {
      userId,
    };

    if (search) {
      where.OR = [
        {
          SubscriptionPlan: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          SubscriptionPlan: {
            description: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [subscriptions, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: {
          SubscriptionPlan: true,
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.subscription.count({
        where,
      }),
    ]);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
