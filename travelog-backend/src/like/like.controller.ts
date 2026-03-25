import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetLikesDto } from './dto/get-likes.dto';

@Controller('api/likes')
@UseGuards(JwtAuthGuard)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  // 여행 기록 좋아요 토글
  @Post('travel-log/:travelLogId')
  async toggleTravelLogLike(
    @Request() req: any,
    @Param('travelLogId') travelLogId: string,
  ) {
    return this.likeService.toggleTravelLogLike(req.user.userId, travelLogId);
  }

  // 댓글 좋아요 토글
  @Post('comment/:commentId')
  async toggleCommentLike(
    @Request() req: any,
    @Param('commentId') commentId: string,
  ) {
    return this.likeService.toggleCommentLike(req.user.userId, commentId);
  }

  // 여행 기록 좋아요 목록
  @Get('travel-log/:travelLogId')
  async getTravelLogLikes(
    @Param('travelLogId') travelLogId: string,
    @Query() query: GetLikesDto,
  ) {
    return this.likeService.getTravelLogLikes(
      travelLogId,
      query.page,
      query.limit,
    );
  }

  // 내가 좋아요한 여행 기록 목록
  @Get('my-likes')
  async getMyLikes(@Request() req: any, @Query() query: GetLikesDto) {
    return this.likeService.getMyLikes(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  // 좋아요 여부 확인
  @Get('check/:travelLogId')
  async checkIfLiked(
    @Request() req: any,
    @Param('travelLogId') travelLogId: string,
  ) {
    const liked = await this.likeService.checkIfLiked(
      req.user.userId,
      travelLogId,
    );
    return { liked };
  }
}
