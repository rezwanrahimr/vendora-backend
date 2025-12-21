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
import { ApiSecurity, ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { 
  userImageStorage, 
  imageFileFilter 
} from '../../common/utils/file-upload.utils';
import { FileSizeInterceptor } from '../../common/interceptors/file-size.interceptor';
import { UploadImageDto, ImageUploadResponseDto } from './dto/upload-image.dto';

@Controller('users')
@ApiTags('Users')
@ApiSecurity("JWT") // Apply JWT security scheme to all endpoints in this controller
@UseGuards(JwtAuthGuard) // All routes require authentication
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


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
    type: ImageUploadResponseDto 
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

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can update users
  @ApiOperation({ summary: 'Update user (Admin only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { name?: string; isActive?: boolean },
  ) {
    return this.usersService.updateUser(id, updateData);
  }

}
