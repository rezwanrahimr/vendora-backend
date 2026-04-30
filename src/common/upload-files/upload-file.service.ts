import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadFileService {
  private s3?: S3Client;
  private bucket?: string;
  private region?: string;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Lazy initialize S3 (only when needed)
   */
  private initS3() {
    if (this.s3) return; // already initialized

    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new InternalServerErrorException(
        'S3 is not configured. Missing AWS environment variables.',
      );
    }

    this.region = region;
    this.bucket = bucket;

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  private generateFileName(file: Express.Multer.File): string {
    const name = file.originalname.split('.')[0];
    const ext = file.originalname.split('.').pop();

    const random = Array(16)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    return `${name}-${Date.now()}-${random}.${ext}`;
  }

  async uploadSingle(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; key: string }> {
    this.initS3(); // ✅ validate only here

    try {
      const key = `${folder}/${this.generateFileName(file)}`;

      await new Upload({
        client: this.s3!,
        params: {
          Bucket: this.bucket!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          // ACL: 'public-read',
        },
      }).done();

      return {
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        key,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<{ url: string; key: string }[]> {
    if (!files?.length) return [];

    this.initS3(); // ✅ validate once

    return Promise.all(files.map((file) => this.uploadSingle(file, folder)));
  }
}
