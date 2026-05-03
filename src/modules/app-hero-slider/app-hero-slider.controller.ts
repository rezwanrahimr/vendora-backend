import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AppHeroSliderService } from './app-hero-slider.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AddImageDto, ManageImageDto } from './dto/app-hero-slider.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UploadSingleImage } from 'src/common/upload-files/decorators/upload-file.decorator';

@Controller('app-hero-slider')
export class AppHeroSliderController {
  constructor(private readonly appHeroSliderService: AppHeroSliderService) {}

  @Post('add-image')
  @ApiBody({ type: AddImageDto })
  @ApiOperation({ summary: 'Add image, only admin can use' })
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
  @ApiOperation({
    summary: 'Manage hero slider images (activate/deactivate)',
    description:
      'Bulk updates hero slider images. Ensures all image IDs exist and enforces a maximum of 5 active images globally.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiBody({ type: ManageImageDto })
  async manageImage(@Body() payload: ManageImageDto) {
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
