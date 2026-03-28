import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzeImageDto } from './dto/analyze-image.dto';
import { AnalyzeEmotionDto } from './dto/analyze-emotion.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('AI 분석')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이미지 분석을 통한 자동 태그 생성' })
  @ApiResponse({
    status: 200,
    description: '이미지 분석 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['#자연', '#산', '#등산', '#여행', '#추억'],
        },
        confidence: { type: 'number', example: 0.85 },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @ApiBody({
    type: AnalyzeImageDto,
    description: '분석할 이미지 URL',
    examples: {
      example1: {
        summary: '산 이미지 분석',
        value: {
          imageUrl: 'https://example.com/mountain.jpg',
        },
      },
    },
  })
  async analyzeImage(@Body() analyzeImageDto: AnalyzeImageDto) {
    try {
      // URL 유효성 검사
      if (
        !analyzeImageDto.imageUrl ||
        !this.isValidUrl(analyzeImageDto.imageUrl)
      ) {
        throw new BadRequestException('유효하지 않은 이미지 URL입니다.');
      }

      const tags = await this.aiService.analyzeImage(analyzeImageDto.imageUrl);

      return {
        success: true,
        tags,
        confidence: 0.85, // 시뮬레이션된 신뢰도
        message: '이미지 분석이 완료되었습니다.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        '이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  @Post('generate-description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사진 분석을 통한 AI 설명 생성' })
  @ApiResponse({
    status: 200,
    description: '설명 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        description: { type: 'string', example: '푸른 바다가 보이는 아름다운 풍경입니다.' },
      },
    },
  })
  async generateDescription(@Body() body: { imageUrls: string[] }) {
    if (!body.imageUrls || body.imageUrls.length === 0) {
      throw new BadRequestException('이미지 URL 배열이 필요합니다.');
    }

    const description = await this.aiService.generatePhotoDescription(body.imageUrls);

    return {
      success: true,
      description,
      message: 'AI 설명 생성이 완료되었습니다.',
    };
  }

  @Post('generate-diary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사진과 장소 정보를 통한 AI 일기 생성' })
  @ApiResponse({
    status: 200,
    description: '일기 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        story: { type: 'string', example: '오늘은 정말 멋진 여행이었습니다...' },
      },
    },
  })
  async generateDiary(@Body() body: { imageUrls: string[]; placeName: string }) {
    if (!body.imageUrls || body.imageUrls.length === 0) {
      throw new BadRequestException('이미지 URL 배열이 필요합니다.');
    }
    if (!body.placeName) {
      throw new BadRequestException('장소명이 필요합니다.');
    }

    const story = await this.aiService.generateDiary(
      body.imageUrls,
      body.placeName,
    );

    return {
      success: true,
      story,
      message: 'AI 일기 생성이 완료되었습니다.',
    };
  }

  @Post('analyze-emotion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEPRECATED] 일기 텍스트 감정 분석' })
  @ApiResponse({ status: 200, description: '감정 분석 성공' })
  async analyzeEmotion(@Body() analyzeEmotionDto: AnalyzeEmotionDto) {
    const result = await this.aiService.analyzeEmotion(analyzeEmotionDto.text);
    return {
      success: true,
      ...result,
      message: '감정 분석이 완료되었습니다. (레거시)',
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: '지도 위치와 사용자 취향을 기반으로 여행지 추천' })
  @ApiResponse({ status: 200, description: '추천 성공' })
  async getRecommendations(
    @GetUser('userId') userId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('isGlobal') isGlobal: string,
  ) {
    const globalMode = isGlobal === 'true';

    if (!globalMode && (!lat || !lng)) {
      throw new BadRequestException('위도(lat)와 경도(lng) 파라미터가 필요합니다.');
    }

    const recommendations = await this.aiService.recommendDestinations(
      userId,
      lat ? parseFloat(lat) : 0,
      lng ? parseFloat(lng) : 0,
      globalMode,
    );

    return {
      success: true,
      recommendations,
      message: '취향 기반 여행지 추천이 완료되었습니다.',
    };
  }

  /**
   * URL 유효성 검사
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
