import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TermsAndConditionService } from './terms-and-condition.service';
import { AddTermsAndConditionDto } from './dto/terms-condition.dto';
import { ApiOperation, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('terms-and-condition')
@ApiSecurity('JWT')
export class TermsAndConditionController {
  constructor(
    private readonly termsAndConditionService: TermsAndConditionService,
  ) {}

  @Post('add')
  @ApiOperation({
    summary: 'Create Terms and Conditions',
    description:
      'Creates a new version of Terms and Conditions. Only one version can be active at a time. only admin can create a new version',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  addTermsAndCondition(@Body() payload: AddTermsAndConditionDto) {
    return this.termsAndConditionService.addTermsAndCondition(payload);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all Terms and Conditions',
    description:
      'Returns all versions of Terms and Conditions. Only admin can get all versions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllTermsAndConditionForAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return this.termsAndConditionService.getAllTermsAndConditionForAll(
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active Terms and Conditions',
    description: 'Returns the active version of Terms and Conditions. ',
  })
  @UseGuards(JwtAuthGuard)
  getActiveTermsAndCondition() {
    return this.termsAndConditionService.getActiveTermsAndCondition();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific Terms and Conditions',
    description: 'Returns a specific version of Terms and Conditions. ',
  })
  async getTermsAndConditionByVersion(id: string) {
    return await this.termsAndConditionService.getTermsAndConditionByVersion(
      id,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Terms and Conditions version',
    description:
      'Updates a Terms and Conditions record by ID. If marked as active, all other versions will be deactivated automatically to ensure only one active version exists.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTermsAndCondition(
    id: string,
    @Body() payload: AddTermsAndConditionDto,
  ) {
    return await this.termsAndConditionService.updateTermsAndCondition(
      id,
      payload,
    );
  }
}
