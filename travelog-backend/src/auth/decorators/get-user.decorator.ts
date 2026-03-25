import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

interface RequestWithUser {
  user: AuthenticatedUser;
}

export const GetUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data ? user[data] : user;
  },
);
