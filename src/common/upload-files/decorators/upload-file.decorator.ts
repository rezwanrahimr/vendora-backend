import {
  applyDecorators,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';

const storage = memoryStorage();

const fileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new BadRequestException('Only image files allowed'), false);
  }
  callback(null, true);
};

const limits = {
  fileSize: 10 * 1024 * 1024,
};

export const UploadSingleImage = (fieldName = 'file') =>
  applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        storage,
        fileFilter,
        limits,
      }),
    ),

    ApiConsumes('multipart/form-data'),

    // ApiBody({
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       [fieldName]: {
    //         type: 'string',
    //         format: 'binary',
    //       },
    //     },
    //   },
    // }),
  );

export const UploadImages = (fieldName = 'files', maxCount = 10) =>
  applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, Math.min(maxCount, 20), {
        storage,
        fileFilter,
        limits,
      }),
    ),

    ApiConsumes('multipart/form-data'),

    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),
  );
