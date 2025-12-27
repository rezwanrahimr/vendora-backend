import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/category.dto';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  categoryImageStorage,
  imageFileFilter,
} from 'src/common/utils/file-upload.utils';
import { FileSizeInterceptor } from 'src/common/interceptors/file-size.interceptor';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryImageStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  create(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.createCategory(dto, file);
  }

  @Get()
  findAll() {
    return this.categoryService.getAllCategories();
  }

  @Get('/vendors/:id')
  findVendorsByCategory(@Param('id') id: string) {
    return this.categoryService.getVendorsByCategory(id);
  }

  @ApiBearerAuth('JWT')
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryImageStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.updateCategory(id, dto, file);
  }
}
