import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FriendshipStatus } from '@prisma/client';

export class GetFriendsDto {
  @IsOptional()
  @IsEnum(FriendshipStatus)
  status?: FriendshipStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
