import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(payload: CreateCategoryDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an image file');
    }

    const imageUrl = `/uploads/category/images/${file.filename}`;

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
    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(file && {
          icon: `/uploads/category/images/${file.filename}`,
        }),
      },
    });
  }
}
