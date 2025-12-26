import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AdminLegalService } from './admin-legal.service';
import { TermsAndConditionsDto, PrivacyPolicyDto } from './dto/admin-legal.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin Legal')
@Controller('admin-legal')
export class AdminLegalController {
  constructor(private readonly adminLegalService: AdminLegalService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current admin legal content' })
  @ApiResponse({
    status: 200,
    description: 'Returns Terms and Conditions and Privacy Policy',
  })
  async getAdminLegal() {
    return this.adminLegalService.getAdminLegal();
  }

  @Patch('/terms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update Terms and Conditions (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Terms and Conditions updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async updateTerms(@Body() payload: TermsAndConditionsDto) {
    return this.adminLegalService.saveTermsAndConditions(payload);
  }

  @Patch('/privacy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update Privacy Policy (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Privacy Policy updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async updatePrivacy(@Body() payload: PrivacyPolicyDto) {
    return this.adminLegalService.savePrivacyPolicy(payload);
  }
}
