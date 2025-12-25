import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PushNotificationService } from './push-notification.service';
import { NotificationQueryDto } from './dto';
import { PushNotificationEntity } from './entities/push-notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SuccessResponse } from '../../common/dto/response.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard) // All routes require authentication
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: [PushNotificationEntity],
  })
  async getNotifications(
    @CurrentUser() user: any,
    @Query() query: NotificationQueryDto,
  ) {
    const result = await this.pushNotificationService.getUserNotifications(
      user.id,
      query.type,
      query.status,
      query.page,
      query.limit,
    );

    return new SuccessResponse('Notifications retrieved successfully', result);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.pushNotificationService.getUnreadCount(user.id);
    return new SuccessResponse('Unread count retrieved successfully', {
      count,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    await this.pushNotificationService.markAsRead(id, user.id);
    return new SuccessResponse('Notification marked as read successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async deleteNotification(@CurrentUser() user: any, @Param('id') id: string) {
    await this.pushNotificationService.deleteNotification(id, user.id);
    return new SuccessResponse('Notification deleted successfully');
  }
}
