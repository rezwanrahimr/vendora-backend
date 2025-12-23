import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AdminLegalService } from './admin-legal.service';
import { AdminLegalDto } from './dto/admin-legal.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('admin-legal')
export class AdminLegalController {
  constructor(private readonly adminLegalService: AdminLegalService) {}

  @Post('/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Body() adminLegalDto: AdminLegalDto) {
    return this.adminLegalService.updateAdminLegal(adminLegalDto);
  }

  @Get('/get')
  get() {
    return this.adminLegalService.getAdminLegal();
  }
}
