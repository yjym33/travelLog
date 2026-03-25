import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';

@Controller('api/comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 댓글 작성 (Rate Limiting: 1분에 10개)
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createComment(@Request() req: any, @Body() dto: CreateCommentDto) {
    return this.commentService.createComment(req.user.userId, dto);
  }

  // 댓글 목록 조회
  @Get('travel-log/:travelLogId')
  async getComments(
    @Param('travelLogId') travelLogId: string,
    @Query() query: GetCommentsDto,
  ) {
    return this.commentService.getComments(
      travelLogId,
      query.page,
      query.limit,
      query.sort,
    );
  }

  // 대댓글 목록 조회
  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() query: GetCommentsDto,
  ) {
    return this.commentService.getReplies(commentId, query.page, query.limit);
  }

  // 댓글 수정
  @Patch(':commentId')
  async updateComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(req.user.userId, commentId, dto);
  }

  // 댓글 삭제
  @Delete(':commentId')
  async deleteComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.deleteComment(req.user.userId, commentId);
  }

  // 내가 작성한 댓글 목록
  @Get('my-comments')
  async getMyComments(@Request() req: any, @Query() query: GetCommentsDto) {
    return this.commentService.getMyComments(
      req.user.userId,
      query.page,
      query.limit,
    );
  }
}
