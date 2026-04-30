import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';
import { UploadFileService } from 'src/common/upload-files/upload-file.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadFileService: UploadFileService,
  ) {}

  async createCategory(payload: CreateCategoryDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an image file');
    }

    const uploadedImage = await this.uploadFileService.uploadSingle(
      file,
      'category',
    );
    if (!uploadedImage?.url) {
      throw new BadRequestException('Failed to upload image');
    }

    const imageUrl = uploadedImage.url;

    return await this.prisma.category.create({
      data: { name: payload.name, icon: imageUrl },
    });
  }

  async getAllCategories() {
    return await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getVendorsByCategory(categoryId: string) {
    return await this.prisma.vendorProfile.findMany({
      where: { categoryId },
    });
  }

  async updateCategory(
    categoryId: string,
    payload: CreateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const updateData: Prisma.CategoryUpdateInput = {};

    if (file) {
      const uploadedImage = await this.uploadFileService.uploadSingle(
        file,
        'category',
      );
      if (!uploadedImage?.url) {
        throw new BadRequestException('Failed to upload image');
      }

      updateData.icon = uploadedImage.url;
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(payload.name && { name: payload.name }),
        ...updateData,
      },
    });
  }
}
