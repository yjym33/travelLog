import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum CommentSort {
  CREATED_ASC = 'createdAt',
  CREATED_DESC = '-createdAt',
  LIKES_DESC = '-likeCount',
}

export class GetCommentsDto {
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

  @IsOptional()
  @IsEnum(CommentSort)
  sort?: CommentSort = CommentSort.CREATED_ASC;
}
