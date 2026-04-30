// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
//   BadRequestException,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { MAX_FILE_SIZE } from '../utils/file-upload.utils';

// @Injectable()
// export class FileSizeInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest();
//     const file = request.file;

//     if (file && file.size > MAX_FILE_SIZE) {
//       throw new BadRequestException(
//         `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
//       );
//     }

//     return next.handle();
//   }
// }
