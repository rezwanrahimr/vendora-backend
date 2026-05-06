import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TermsAndConditionService } from './terms-and-condition.service';
import { AddTermsAndConditionDto } from './dto/terms-condition.dto';
import { ApiOperation, ApiSecurity } from '@nestjs/swagger';
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
}
