import {
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTravelDto {
  @ApiProperty({ example: 37.5665, description: '위도' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 126.978, description: '경도' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ example: '서울 한강공원', description: '장소명' })
  @IsString()
  @MinLength(1)
  placeName: string;

  @ApiProperty({ example: 'South Korea', description: '국가' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'happy', description: '감정' })
  @IsString()
  emotion: string;

  @ApiProperty({
    example: ['https://example.com/photo1.jpg'],
    description: '사진 URL 배열',
  })
  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @ApiProperty({
    example: '오늘 한강에서 정말 좋은 시간을 보냈어요!',
    description: '일기',
  })
  @IsString()
  diary: string;

  @ApiProperty({ example: ['#한강', '#노을'], description: '태그 배열' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}



