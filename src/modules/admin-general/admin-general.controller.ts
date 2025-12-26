import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { AdminGeneralService } from './admin-general.service';
import { SaveLanguageDto, SaveSystemDto } from './dto/admin-general.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('admin-general')
export class AdminGeneralController {
  constructor(private readonly adminGeneralService: AdminGeneralService) {}

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update language settings, admin only' })
  @Patch('language')
  updateLanguage(@Body() dto: SaveLanguageDto) {
    return this.adminGeneralService.upsertLanguage(dto);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update system settings, admin only' })
  @Patch('system')
  updateSystem(@Body() dto: SaveSystemDto) {
    return this.adminGeneralService.upsertSystem(dto);
  }

  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get admin general settings, ' })
  @Get()
  getAdminGeneral() {
    return this.adminGeneralService.getAdminGeneral();
  }
}
