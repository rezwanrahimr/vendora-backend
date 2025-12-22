import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: need to upload image
  async createCategory(payload: CreateCategoryDto) {
    return await this.prisma.category.create({ data: { name: payload.name } });
  }


  // TODO: add search
  async getAllCategories() {
    return await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        vendorProfiles: true,
      },
    });
  }
}
