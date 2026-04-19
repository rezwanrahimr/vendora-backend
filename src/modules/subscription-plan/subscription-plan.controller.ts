import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionPlanDto } from './dto/subscription.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth("JWT")
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '',description:""
  })
  async createSubscriptionPlan(@Body() payload: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.createSubscriptionPlan(payload);
  }
}
