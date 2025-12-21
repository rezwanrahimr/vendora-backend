import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'User profile image (jpg, jpeg, png, gif, webp)',
    required: true,
  })
  image: any;
}

export class ImageUploadResponseDto {
  @ApiProperty({ example: '/uploads/users/images/profile-1703145678901-a1b2c3d4e5f6g7h8.jpg' })
  imageUrl: string;

  @ApiProperty({ example: 'Image uploaded successfully' })
  message: string;
}
