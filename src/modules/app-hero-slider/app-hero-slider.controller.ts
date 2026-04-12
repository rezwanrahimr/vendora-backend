import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppHeroSliderService } from './app-hero-slider.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { AddImageDto, ManageImageDto } from './dto/app-hero-slider.dto';
import {
  appHeroSliderStorage,
  imageFileFilter,
} from 'src/common/utils/file-upload.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeInterceptor } from 'src/common/interceptors/file-size.interceptor';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UploadSingleFile } from 'src/common/upload-files/interceptors/upload.interceptor';
import { UploadSingleImage } from 'src/common/upload-files/decorators/upload-file.decorator';

@Controller('app-hero-slider')
export class AppHeroSliderController {
  constructor(private readonly appHeroSliderService: AppHeroSliderService) {}

  @Post('add-image')
  @ApiBody({ type: AddImageDto })
  @ApiOperation({ summary: 'Add image, only admin can use' })
  // @UseInterceptors(
  //   FileInterceptor('image', {
  //     storage: appHeroSliderStorage,
  //     fileFilter: imageFileFilter,
  //   }),
  //   FileSizeInterceptor,
  // )
  @UploadSingleImage('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  async addImage(@UploadedFile() file?: Express.Multer.File) {
    return await this.appHeroSliderService.addImage(file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove image, only admin can use' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  async removeImage(@Param('id') id: string) {
    return await this.appHeroSliderService.removeImage(id);
  }

  @Patch('manage-image')
  @ApiOperation({ summary: 'Manage images, only admin can use' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiBody({ type: ManageImageDto })
  async manageImage(payload: ManageImageDto) {
    return await this.appHeroSliderService.manageImage(payload);
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all images, only admin can use' })
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  async getAllImages() {
    return await this.appHeroSliderService.getAllImages();
  }

  @Get('/active')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get active image' })
  @ApiBearerAuth('JWT')
  async getActiveImage() {
    return await this.appHeroSliderService.getActiveImage();
  }
}
