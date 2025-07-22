/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

/**
 * 속성을 선택적으로 만들고 null 값을 undefined로 변환하는 데코레이터
 * @IsOptional과 @Transform을 결합하여 일관된 값 처리를 제공
 */
export function IsOptionalExcludeNil(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    IsOptional()(target, propertyKey);
    Transform(({ value }) => value ?? undefined)(target, propertyKey);
  };
}
