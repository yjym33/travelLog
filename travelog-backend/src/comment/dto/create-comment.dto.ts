import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsUUID()
  travelLogId: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 1000)
  @Matches(/^[^<>]*$/, { message: '댓글에 HTML 태그를 사용할 수 없습니다.' })
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
