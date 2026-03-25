import { IsOptional, IsInt, Min, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ShareVisibility } from '@prisma/client';

export class GetFeedDto {
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
  @IsArray()
  @IsEnum(ShareVisibility, { each: true })
  visibility?: ShareVisibility[] = [
    ShareVisibility.FRIENDS,
    ShareVisibility.PUBLIC,
  ];
}
