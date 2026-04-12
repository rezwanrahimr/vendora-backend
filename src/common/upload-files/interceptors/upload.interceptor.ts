import { BadRequestException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

export const UploadSingleFile = (fieldName = 'file') =>
  UseInterceptors(
    FileInterceptor(fieldName, {
      storage,
      fileFilter,
      limits,
    }),
  );

export const UploadMultipleFiles = (fieldName = 'files', maxCount = 10) =>
  UseInterceptors(
    FilesInterceptor(fieldName, Math.min(maxCount, 20), {
      storage,
      fileFilter,
      limits,
    }),
  );
