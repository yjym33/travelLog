import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeEmotionDto {
  @ApiProperty({
    description: '분석할 일기 텍스트',
    example: '오늘은 정말 행복한 하루였다. 친구들과 함께 즐거운 시간을 보냈다.',
    type: String,
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: '일기 텍스트는 최소 10자 이상이어야 합니다.' })
  text: string;
}
