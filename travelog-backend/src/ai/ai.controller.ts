import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
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

  @Post('analyze-emotion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '일기 텍스트 감정 분석' })
  @ApiResponse({
    status: 200,
    description: '감정 분석 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        emotion: { type: 'string', example: 'happy' },
        confidence: { type: 'number', example: 0.9 },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          example: ['행복', '기쁨'],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @ApiBody({
    type: AnalyzeEmotionDto,
    description: '분석할 일기 텍스트',
    examples: {
      example1: {
        summary: '행복한 일기',
        value: {
          text: '오늘은 정말 행복한 하루였다. 친구들과 함께 즐거운 시간을 보냈다.',
        },
      },
    },
  })
  async analyzeEmotion(@Body() analyzeEmotionDto: AnalyzeEmotionDto) {
    try {
      // 텍스트 유효성 검사
      if (!analyzeEmotionDto.text || analyzeEmotionDto.text.trim().length < 3) {
        throw new BadRequestException(
          '분석할 텍스트가 너무 짧습니다. 최소 3자 이상 입력해주세요.',
        );
      }

      const result = await this.aiService.analyzeEmotion(
        analyzeEmotionDto.text,
      );

      return {
        success: true,
        ...result,
        message: '감정 분석이 완료되었습니다.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        '감정 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
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
