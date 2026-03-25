import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeImageDto {
  @ApiProperty({
    description: '분석할 이미지 URL',
    example: 'https://example.com/photo.jpg',
    type: String,
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;
}
