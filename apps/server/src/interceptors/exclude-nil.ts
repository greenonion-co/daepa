import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNilInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((value) => this.excludeNil(value)));
  }

  private excludeNil(value: any): any {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === 'object' ? this.excludeNil(item) : item,
      );
    }
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, val]) => val !== undefined && val !== null)
          .map(([key, val]) => [key, this.excludeNil(val)]),
      );
    }
    return value;
  }
}
