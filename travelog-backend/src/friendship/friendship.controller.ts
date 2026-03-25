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
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { GetFriendsDto } from './dto/get-friends.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('api/friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  // 친구 요청 보내기
  @Post('requests')
  async sendFriendRequest(
    @Request() req: any,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendshipService.sendFriendRequest(
      req.user.userId,
      dto.addresseeId,
    );
  }

  // 친구 요청 수락
  @Patch('requests/:requestId/accept')
  async acceptFriendRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.friendshipService.acceptFriendRequest(
      req.user.userId,
      requestId,
    );
  }

  // 친구 요청 거절
  @Patch('requests/:requestId/reject')
  async rejectFriendRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.friendshipService.rejectFriendRequest(
      req.user.userId,
      requestId,
    );
  }

  // 친구 목록 조회
  @Get()
  async getFriends(@Request() req: any, @Query() query: GetFriendsDto) {
    return this.friendshipService.getFriends(
      req.user.userId,
      query.status,
      query.page,
      query.limit,
    );
  }

  // 받은 친구 요청 목록
  @Get('requests/received')
  async getReceivedRequests(
    @Request() req: any,
    @Query() query: GetFriendsDto,
  ) {
    return this.friendshipService.getReceivedRequests(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  // 보낸 친구 요청 목록
  @Get('requests/sent')
  async getSentRequests(@Request() req: any, @Query() query: GetFriendsDto) {
    return this.friendshipService.getSentRequests(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  // 친구 삭제
  @Delete(':friendshipId')
  async removeFriend(
    @Request() req: any,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendshipService.removeFriend(req.user.userId, friendshipId);
  }

  // 사용자 검색
  @Get('search')
  async searchUsers(@Request() req: any, @Query() query: SearchUsersDto) {
    return this.friendshipService.searchUsers(
      query.query,
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  // 친구 관계 상태 조회
  @Get('status/:userId')
  async getFriendshipStatus(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    return this.friendshipService.getFriendshipStatus(req.user.userId, userId);
  }
}
