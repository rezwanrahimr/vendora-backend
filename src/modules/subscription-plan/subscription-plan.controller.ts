import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiBearerAuth('JWT')
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create subscription plan',
    description:
      'Creates the single subscription plan for the system. Only one plan is allowed; if exists, it will be rejected.',
  })
  async createSubscriptionPlan(@Body() payload: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.createSubscriptionPlan(payload);
  }

  @Get()
  @ApiOperation({
    summary: 'Get subscription plan',
    description: 'Retrieves the single subscription plan for the system.',
  })
  async getSubscriptionPlan() {
    return this.subscriptionPlanService.getSubscriptionPlan();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update subscription plan',
    description: 'Updates subscription plan details by ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Subscription plan ID',
    example: '33239348',
  })
  async updateSubscriptionPlan(
    @Body() payload: UpdateSubscriptionPlanDto,
    @Param('id') id: string,
  ) {
    return this.subscriptionPlanService.updateSubscriptionPlan(payload, id);
  }
}
