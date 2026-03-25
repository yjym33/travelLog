import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({ example: '2024년 여름 여행', description: '스토리 제목' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    example: '잊을 수 없는 여름 여행 이야기',
    description: '스토리 설명',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'https://example.com/cover.jpg',
    description: '커버 이미지 URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    example: 'timeline',
    description: '스토리 템플릿 (timeline | map | gallery | mood)',
  })
  @IsString()
  @IsIn(['timeline', 'map', 'gallery', 'mood'])
  template: string;

  @ApiProperty({
    example: ['travel-log-id-1', 'travel-log-id-2'],
    description: '포함할 여행 기록 ID 배열',
  })
  @IsArray()
  @IsString({ each: true })
  travelLogIds: string[];

  @ApiProperty({ example: false, description: '공개 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}



