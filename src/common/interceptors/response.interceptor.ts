import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in ResponseDto format, return it
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Otherwise, wrap it
        return new ResponseDto(true, 'Success', data);
      }),
    );
  }
}