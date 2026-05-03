import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  ManageImageDto,
} from './dto/app-hero-slider.dto';
import { UploadFileService } from 'src/common/upload-files/upload-file.service';

@Injectable()
export class AppHeroSliderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadFileService: UploadFileService,
  ) {}

  async addImage(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an image file');
    }

    const existingImageCount = await this.prisma.appHeroSlider.count({
      where: { isActive: true },
    });

    if (existingImageCount >= 5) {
      throw new BadRequestException('Maximum 5 images allowed');
    }

    const uploadedImage = await this.uploadFileService.uploadSingle(
      file,
      'app-hero-slider',
    );

    if (!uploadedImage?.url) {
      throw new BadRequestException('Failed to upload image');
    }

    return this.prisma.appHeroSlider.create({
      data: {
        imageUrl: uploadedImage.url,
      },
    });
  }

  removeImage(id: string) {
    return this.prisma.appHeroSlider.delete({ where: { id } });
  }

  async manageImage(payload: ManageImageDto) {
    const ids = payload.images.map((i) => i.id);

    // 1. Ensure all images exist
    const existingCount = await this.prisma.appHeroSlider.count({
      where: { id: { in: ids } },
    });

    if (existingCount !== ids.length) {
      throw new BadRequestException('One or more images not found');
    }

    // 2. Enforce max 5 active images (global)
    const activeInPayload = payload.images.filter((i) => i.isActive).length;

    const activeOutsidePayload = await this.prisma.appHeroSlider.count({
      where: {
        isActive: true,
        id: { notIn: ids },
      },
    });

    if (activeOutsidePayload + activeInPayload > 5) {
      throw new BadRequestException('Maximum 5 active hero images allowed');
    }

    // 3. Update row-by-row (required)
    await this.prisma.$transaction(
      payload.images.map((image) =>
        this.prisma.appHeroSlider.update({
          where: { id: image.id },
          data: { isActive: image.isActive },
        }),
      ),
    );

    return 'Hero images updated successfully';
  }

  async getAllImages() {
    return await this.prisma.appHeroSlider.findMany();
  }

  async getActiveImage() {
    return await this.prisma.appHeroSlider.findMany({
      where: { isActive: true },
    });
  }
}
