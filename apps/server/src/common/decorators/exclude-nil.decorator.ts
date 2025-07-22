import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export function IsOptionalExcludeNil() {
  return function (target: any, propertyKey: string) {
    IsOptional()(target, propertyKey);
    Transform(({ value }) => value ?? undefined)(target, propertyKey);
  };
}
