// import { extname } from 'path';
// import { BadRequestException } from '@nestjs/common';
// import { diskStorage } from 'multer';
// import { existsSync, mkdirSync } from 'fs';

// // Allowed image file types
// export const imageFileFilter = (req: any, file: any, callback: any) => {
//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
//     return callback(
//       new BadRequestException(
//         'Only image files are allowed (jpg, jpeg, png, gif, webp)',
//       ),
//       false,
//     );
//   }
//   callback(null, true);
// };

// // Generate unique filename
// export const editFileName = (req: any, file: any, callback: any) => {
//   const name = file.originalname.split('.')[0];
//   const fileExtName = extname(file.originalname);
//   const randomName = Array(16)
//     .fill(null)
//     .map(() => Math.round(Math.random() * 16).toString(16))
//     .join('');
//   callback(null, `${name}-${Date.now()}-${randomName}${fileExtName}`);
// };

// // Create upload directory if it doesn't exist
// export const createUploadDir = (path: string) => {
//   if (!existsSync(path)) {
//     mkdirSync(path, { recursive: true });
//   }
// };

// // Storage configuration for user images
// export const userImageStorage = diskStorage({
//   destination: (req: any, file: any, callback: any) => {
//     const uploadPath = './uploads/users/images';
//     createUploadDir(uploadPath);
//     callback(null, uploadPath);
//   },

//   filename: editFileName,
// });

// export const categoryImageStorage = diskStorage({
//   destination: (req: any, file: any, callback: any) => {
//     const uploadPath = './uploads/category/images';
//     createUploadDir(uploadPath);
//     callback(null, uploadPath);
//   },
//   filename: editFileName,
// });

// export const offerImageStorage = diskStorage({
//   destination: (req: any, file: any, callback: any) => {
//     const uploadPath = './uploads/offer/images';
//     createUploadDir(uploadPath);
//     callback(null, uploadPath);
//   },
//   filename: editFileName,
// });

// export const vendorLogoStorage = diskStorage({
//   destination: (req: any, file: any, callback: any) => {
//     const uploadPath = './uploads/vendors/logos';
//     createUploadDir(uploadPath);
//     callback(null, uploadPath);
//   },
//   filename: editFileName,
// });

// export const appHeroSliderStorage = diskStorage({
//   destination: (req: any, file: any, callback: any) => {
//     const uploadPath = './uploads/app-hero-slider';
//     createUploadDir(uploadPath);
//     callback(null, uploadPath);
//   },
//   filename: editFileName,
// });

// // File size limit (5MB)
// export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
