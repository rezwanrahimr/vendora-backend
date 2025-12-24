import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  ParseIntPipe,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  userImageStorage,
  imageFileFilter,
} from '../../common/utils/file-upload.utils';
import { FileSizeInterceptor } from '../../common/interceptors/file-size.interceptor';
import { UploadImageDto, ImageUploadResponseDto } from './dto/upload-image.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { RegisterFcmTokenDto, RemoveFcmTokenDto } from '../notification/dto';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('JWT') 
@UseGuards(JwtAuthGuard) // All routes require authentication
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  // Get current user profile - no role restriction
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: userImageStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  async uploadImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload an image file');
    }

    return this.usersService.uploadUserImage(user.id, file.filename);
  }

  @Delete('delete-image')
  @ApiOperation({ summary: 'Delete user profile image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'User has no profile image' })
  async deleteImage(@CurrentUser() user: any) {
    return this.usersService.deleteUserImage(user.id);
  }

  @Patch('notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateNotificationPreferences(
    @CurrentUser() user: any,
    @Body() updateData: UpdateNotificationDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, updateData);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  updateProfile(@CurrentUser() user: any, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUser(user.id, updateData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  updateById(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUser(id, updateData);
  }

  @Post('fcm-token')
  @ApiOperation({ summary: 'Register FCM token for push notifications' })
  @ApiResponse({
    status: 200,
    description: 'FCM token registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid token data' })
  async registerFcmToken(
    @CurrentUser() user: any,
    @Body() registerDto: RegisterFcmTokenDto,
  ) {
    return this.usersService.registerFcmToken(
      user.id,
      registerDto.token,
      registerDto.platform,
      registerDto.deviceId,
    );
  }

  @Delete('fcm-token')
  @ApiOperation({ summary: 'Remove FCM token' })
  @ApiResponse({
    status: 200,
    description: 'FCM token removed successfully',
  })
  async removeFcmToken(
    @CurrentUser() user: any,
    @Body() removeDto: RemoveFcmTokenDto,
  ) {
    return this.usersService.removeFcmToken(user.id, removeDto.token);
  }
}
