import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/subscription.dto';

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
}
