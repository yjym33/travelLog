import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FilterTravelDto {
  @ApiProperty({ required: false, description: '감정 필터 (쉼표로 구분)' })
  @IsOptional()
  @IsString()
  emotions?: string;

  @ApiProperty({ required: false, description: '국가 필터 (쉼표로 구분)' })
  @IsOptional()
  @IsString()
  countries?: string;

  @ApiProperty({ required: false, description: '태그 필터 (쉼표로 구분)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({ required: false, description: '시작 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: '종료 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}



