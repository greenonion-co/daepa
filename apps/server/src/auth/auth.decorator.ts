import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OAuthAuthenticatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
