import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminNotificationService } from './admin-notification.service';
import {
  EmailNotificationDto,
  PushNotificationDto,
} from './dto/admin-notification.dto';
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

@ApiTags('Admin Notifications')
@Controller('admin-notification')
export class AdminNotificationController {
  constructor(
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  @Patch('/push-notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update push notification settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Push notification settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async savePushNotificationSettings(@Body() payload: PushNotificationDto) {
    return await this.adminNotificationService.savePushNotificationSettings(
      payload,
    );
  }

  @Patch('/email-notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email notification settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Email notification settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async saveEmailNotificationSettings(@Body() payload: EmailNotificationDto) {
    return await this.adminNotificationService.saveEmailNotificationSettings(
      payload,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin notification settings' })
  @ApiResponse({ status: 200, description: 'Returns admin notification settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAdminNotification() {
    return await this.adminNotificationService.getAdminNotification();
  }
}
