import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/category.dto';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  categoryImageStorage,
  imageFileFilter,
} from 'src/common/utils/file-upload.utils';
import { FileSizeInterceptor } from 'src/common/interceptors/file-size.interceptor';

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

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryImageStorage,
      fileFilter: imageFileFilter,
    }),
    FileSizeInterceptor,
  )
  update(
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.updateCategory(id, dto, file);
  }
}
