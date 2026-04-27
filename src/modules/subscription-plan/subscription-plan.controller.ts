import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

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
    summary: 'Create subscription plan [ADMIN]',
    description:
      'Creates the single subscription plan for the system. Only one plan is allowed; if exists, it will be rejected.',
  })
  async createSubscriptionPlan(@Body() payload: CreateSubscriptionPlanDto) {
    return this.subscriptionPlanService.createSubscriptionPlan(payload);
  }

  @Get()
  @ApiOperation({
    summary: 'Get subscription plans',
    description:
      'Retrieves all subscription plans with optional search and pagination.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllSubscriptionPlans(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.subscriptionPlanService.getAllSubscriptionPlans(
      search,
      page,
      limit,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update subscription plan [ADMIN]',
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get subscription plan by ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Subscription plan ID',
    example: '33239348',
  })
  async getSubscriptionPlanById(@Param('id') id: string) {
    return this.subscriptionPlanService.getSubscriptionPlanById(id);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Toggle subscription plan status [ADMIN] ',
    description: 'Toggles the active status of a subscription plan by ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Subscription plan ID',
    example: '33239348',
  })
  async toggleSubscriptionPlanStatus(@Param('id') id: string) {
    return this.subscriptionPlanService.toggleSubscriptionPlanStatus(id);
  }
}
