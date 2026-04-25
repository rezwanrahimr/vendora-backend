import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  //TODO:  later will add coupon code and other features
  async bookSubscription(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('User is not active');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const now = new Date();

    // 🚨 Prevent multiple active subscriptions
    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: now },
      },
    });

    if (existingActive) {
      throw new BadRequestException('User already has an active subscription');
    }

    const subscriptionEnd = new Date(
      now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Create subscription (PENDING)
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          price: plan.price,
          finalPrice: plan.price,
          discountAmount: 0,
          startDate: now,
          endDate: subscriptionEnd,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // 2. Create payment (PENDING)
      const payment = await tx.payment.create({
        data: {
          amount: plan.price,
          provider: 'NESTPAY',
          status: 'PENDING',
          subscriptionId: subscription.id,
          userId,
        },
      });

      return {
        subscription,
        payment,
      };
    });
  }

  async checkoutPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        Subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.Subscription.userId !== userId) {
      throw new BadRequestException('Unauthorized payment access');
    }

    if (payment.status === 'COMPLETED') {
      return {
        message: 'Payment already completed',
        paymentId,
        status: payment.status,
      };
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
            ...(this.asObject(existingMetadata.nestpay) as Record<string, unknown>),
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
      message: 'NestPay checkout initialized successfully',
      paymentId,
      method: 'POST',
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

  async generateCheckoutForm(paymentId: string, userId: string): Promise<string> {
    const checkoutData = await this.checkoutPayment(paymentId, userId);
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
              ...(this.asObject(existingMetadata.nestpay) as Record<string, unknown>),
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
}
