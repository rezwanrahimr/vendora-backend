import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscriptionPlan(data: CreateSubscriptionPlanDto) {
    const existPlan = await this.prisma.subscriptionPlan.findFirst({
      select: { id: true },
    });

    if (existPlan) {
      throw new BadRequestException('Subscription plan already exists');
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationInDays: data.durationInDays,
      },
    });
  }

  async getSubscriptionPlan() {
    return this.prisma.subscriptionPlan.findFirst();
  }

  async updateSubscriptionPlan(data: UpdateSubscriptionPlanDto, id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: cleanData,
    });
  }
}
