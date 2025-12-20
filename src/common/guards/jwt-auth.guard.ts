import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log('JwtAuthGuard - Authorization header:', request.headers.authorization);
    
    const result = super.canActivate(context);
    
    // Handle both Promise and Observable returns
    if (result instanceof Promise) {
      return result
        .then((val) => {
          console.log('JwtAuthGuard - Validation passed, user:', request.user);
          return val;
        })
        .catch((err) => {
          console.log('JwtAuthGuard - Validation FAILED:', err.message);
          throw err;
        });
    } else if (result instanceof Observable) {
      return result.pipe(
        tap(() => console.log('JwtAuthGuard - Validation passed, user:', request.user)),
        catchError((err) => {
          console.log('JwtAuthGuard - Validation FAILED:', err.message);
          throw err;
        })
      );
    }
    
    return result;
  }
}
