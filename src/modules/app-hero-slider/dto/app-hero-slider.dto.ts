import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ============================
 * ADD HERO SLIDER IMAGE DTO
 * ============================
 */
export class AddImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
    description:
      'Hero slider image file. Supported formats: jpg, jpeg, png, gif, webp.',
  })
  image: any;
}

/**
 * ============================
 * MANAGE HERO SLIDER IMAGE ITEM
 * ============================
 */
class ManageImageItemDto {
  @ApiProperty({
    example: 'c9c9e1c1-4c2a-4c88-bb2e-9f6c1b9e2a11',
    description: 'Unique identifier of the hero slider image',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: true,
    description:
      'Activation status of the image. Set true to display the image in the slider, false to hide it.',
    required: true,
  })
  @IsBoolean()
  isActive: boolean;
}

/**
 * ============================
 * MANAGE HERO SLIDER IMAGES DTO
 * ============================
 */
export class ManageImageDto {
  @ApiProperty({
    type: [ManageImageItemDto],
    required: true,
    description:
      'Array of hero slider images to activate or deactivate in bulk.',
    example: [
      {
        id: 'c9c9e1c1-4c2a-4c88-bb2e-9f6c1b9e2a11',
        isActive: true,
      },
      {
        id: 'd7a3b9a2-91f1-4f1a-b5b7-9c3e2d8a1123',
        isActive: false,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManageImageItemDto)
  images: ManageImageItemDto[];
}

/**
 * ============================
 * REORDER HERO SLIDER ITEM DTO
 * ============================
 */
export class ReorderHeroSliderItemDto {
  @ApiProperty({
    example: 'c9c9e1c1-4c2a-4c88-bb2e-9f6c1b9e2a11',
    description: 'Unique identifier of the hero slider image',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 1,
    description:
      'Display order of the image in the hero slider. Order index starts from 1.',
    required: true,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  order: number;
}

/**
 * ============================
 * REORDER HERO SLIDER DTO
 * ============================
 */
export class ReorderHeroSliderDto {
  @ApiProperty({
    type: [ReorderHeroSliderItemDto],
    required: true,
    description:
      'Array defining the new order of hero slider images. All active images should be included.',
    example: [
      {
        id: 'c9c9e1c1-4c2a-4c88-bb2e-9f6c1b9e2a11',
        order: 1,
      },
      {
        id: 'd7a3b9a2-91f1-4f1a-b5b7-9c3e2d8a1123',
        order: 2,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderHeroSliderItemDto)
  items: ReorderHeroSliderItemDto[];
}
