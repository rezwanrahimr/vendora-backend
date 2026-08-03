import { BadRequestException } from '@nestjs/common';
jest.mock(
  'src/prisma.service',
  () => ({
    PrismaService: class PrismaService {},
  }),
  { virtual: true },
);
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  const paymentId = '0fe7d234-04c4-4518-a25b-016d58bb8b42';
  const subscriptionId = 'sub_123';
  const userId = 'user_123';

  const createService = () => {
    const tx = {
      payment: {
        update: jest.fn(),
      },
      subscription: {
        update: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    const prisma = {
      payment: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'nestpay.gatewayUrl': 'https://gateway.test/3d',
          'nestpay.clientId': 'client-id',
          'nestpay.storeKey': 'store-key',
          'nestpay.okUrl': 'https://app.test/payment/success',
          'nestpay.failUrl': 'https://app.test/payment/fail',
          'nestpay.currency': '941',
          'nestpay.trantype': 'PreAuth',
          'nestpay.storetype': '3d_pay_hosting',
          'nestpay.lang': 'sr',
          'nestpay.encoding': 'utf-8',
        };

        return values[key];
      }),
    };

    const service = new SubscriptionService(
      prisma as never,
      configService as never,
    );

    return {
      service,
      prisma,
      tx,
    };
  };

  it('normalizes duplicated callback oid values before querying Prisma', async () => {
    const { service, prisma, tx } = createService();

    prisma.payment.findUnique.mockResolvedValue({
      id: paymentId,
      status: 'PENDING',
      subscriptionId,
      userId,
      providerTransactionId: null,
      metadata: {},
    });

    const result = await service.handlePaymentCallback({
      oid: [paymentId, paymentId],
      mdStatus: '1',
      ProcReturnCode: '00',
      Response: 'Approved',
      TransId: ['txn-123', 'txn-123'],
    });

    expect(prisma.payment.findUnique).toHaveBeenCalledWith({
      where: { id: paymentId },
      include: { Subscription: true },
    });
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: paymentId },
        data: expect.objectContaining({
          status: 'COMPLETED',
          providerTransactionId: 'txn-123',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        paymentId,
        subscriptionId,
        status: 'COMPLETED',
      }),
    );
  });

  it('rejects conflicting callback oid values', async () => {
    const { service, prisma } = createService();

    await expect(
      service.handlePaymentCallback({
        oid: [paymentId, 'different-payment-id'],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it('normalizes duplicated payment result identifiers', async () => {
    const { service, prisma } = createService();

    prisma.payment.findUnique.mockResolvedValue({
      id: paymentId,
      status: 'COMPLETED',
      subscriptionId,
      metadata: {
        nestpay: {
          callbackPayload: {
            Response: 'Approved',
          },
        },
      },
    });

    const result = await service.getPaymentStatus([paymentId, paymentId]);

    expect(prisma.payment.findUnique).toHaveBeenCalledWith({
      where: { id: paymentId },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: paymentId,
        status: 'COMPLETED',
        subscriptionId,
      }),
    );
  });
});
