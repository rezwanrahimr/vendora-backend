import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    console.log("🚀 ~ current-user.decorator.ts:7 ~ request:", request)

    return request.user;
  },
);
