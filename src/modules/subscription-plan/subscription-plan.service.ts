import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscriptionPlan(data: CreateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationInDays: data.durationInDays,
        currency: data.currency,
        currentPriceDisplay: data.currentPriceDisplay,
      },
    });
  }

  async getAllSubscriptionPlans(
    search?: string,
    page: number = 1,
    limit: number = 10,
    filter?: {
      isActive?: string;
    },
  ) {
    const where: Prisma.SubscriptionPlanWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive === 'true';
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.subscriptionPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscriptionPlan.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateSubscriptionPlan(data: UpdateSubscriptionPlanDto, id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const cleanData: Prisma.SubscriptionPlanUpdateInput = {};

    if (data.name !== undefined) cleanData.name = data.name;
    if (data.description !== undefined)
      cleanData.description = data.description;
    if (data.price !== undefined) cleanData.price = data.price;
    if (data.durationInDays !== undefined)
      cleanData.durationInDays = data.durationInDays;
    if (data.currency !== undefined) cleanData.currency = data.currency;
    if (data.currentPriceDisplay !== undefined)
      cleanData.currentPriceDisplay = data.currentPriceDisplay;

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: cleanData,
    });
  }

  async getSubscriptionPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async toggleSubscriptionPlanStatus(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        isActive: !plan.isActive,
      },
    });

    return {
      id: updated.id,
      isActive: updated.isActive,
      message: updated.isActive
        ? 'Subscription plan is now active'
        : 'Subscription plan is now inactive',
    };
  }
}
