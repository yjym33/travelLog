import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SocialTravelService } from './social-travel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { ShareTravelLogDto } from './dto/share-travel-log.dto';
import { GetFeedDto } from './dto/get-feed.dto';

@Controller('api/travel-logs')
@UseGuards(JwtAuthGuard)
export class SocialTravelController {
  constructor(private readonly socialTravelService: SocialTravelService) {}

  // 여행 기록 피드
  @Get('feed')
  async getFeed(@Request() req: any, @Query() query: GetFeedDto) {
    return this.socialTravelService.getFeed(
      req.user.userId,
      query.page,
      query.limit,
      query.visibility,
    );
  }

  // 특정 사용자의 여행 기록
  @Get('user/:userId')
  async getUserTravelLogs(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query() query: GetFeedDto,
  ) {
    return this.socialTravelService.getUserTravelLogs(
      req.user.userId,
      userId,
      query.page,
      query.limit,
    );
  }

  // 공개 범위 변경
  @Patch(':travelLogId/visibility')
  async updateVisibility(
    @Request() req: any,
    @Param('travelLogId') travelLogId: string,
    @Body() dto: UpdateVisibilityDto,
  ) {
    return this.socialTravelService.updateVisibility(
      req.user.userId,
      travelLogId,
      dto,
    );
  }

  // 여행 기록 공유
  @Post(':travelLogId/share')
  async shareTravelLog(
    @Request() req: any,
    @Param('travelLogId') travelLogId: string,
    @Body() dto: ShareTravelLogDto,
  ) {
    return this.socialTravelService.shareTravelLog(
      req.user.userId,
      travelLogId,
      dto,
    );
  }

  // 나와 공유된 여행 기록 목록
  @Get('shared/received')
  async getSharedWithMe(@Request() req: any, @Query() query: GetFeedDto) {
    return this.socialTravelService.getSharedWithMe(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  // 조회수 증가
  @Post(':travelLogId/view')
  async incrementViewCount(@Param('travelLogId') travelLogId: string) {
    return this.socialTravelService.incrementViewCount(travelLogId);
  }
}
