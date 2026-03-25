import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipService } from '../friendship/friendship.service';
import { ShareVisibility, FriendshipStatus } from '@prisma/client';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { ShareTravelLogDto } from './dto/share-travel-log.dto';

@Injectable()
export class SocialTravelService {
  constructor(
    private prisma: PrismaService,
    private friendshipService: FriendshipService,
  ) {}

  // 여행 기록 피드 조회 (친구 + 공개)
  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 20,
    visibilityFilter: ShareVisibility[] = [
      ShareVisibility.FRIENDS,
      ShareVisibility.PUBLIC,
    ],
  ) {
    const skip = (page - 1) * limit;

    // 친구 ID 목록 조회
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: FriendshipStatus.ACCEPTED,
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );

    // 피드 쿼리 조건
    const whereCondition: any = {
      OR: [
        // 공개 여행 기록
        {
          visibility: ShareVisibility.PUBLIC,
        },
        // 친구 여행 기록 (친구만 공개 + 친구의 공개 여행 기록)
        {
          userId: { in: friendIds },
          visibility: { in: [ShareVisibility.FRIENDS, ShareVisibility.PUBLIC] },
        },
      ],
    };

    // visibility 필터 적용
    if (visibilityFilter && visibilityFilter.length > 0) {
      whereCondition.visibility = { in: visibilityFilter };
    }

    const [travelLogs, total] = await Promise.all([
      this.prisma.travelLog.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
              friendsCount: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.travelLog.count({ where: whereCondition }),
    ]);

    // 각 여행 기록에 대한 좋아요 여부 확인
    const travelLogIds = travelLogs.map((log) => log.id);
    const userLikes = await this.prisma.travelLogLike.findMany({
      where: {
        userId,
        travelLogId: { in: travelLogIds },
      },
      select: { travelLogId: true },
    });

    const likedLogIds = new Set(userLikes.map((like) => like.travelLogId));

    const enrichedTravelLogs = travelLogs.map((log) => ({
      ...log,
      isLikedByMe: likedLogIds.has(log.id),
    }));

    return {
      data: enrichedTravelLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 특정 사용자의 여행 기록 조회
  async getUserTravelLogs(
    currentUserId: string,
    targetUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    // 본인인 경우
    if (currentUserId === targetUserId) {
      const [travelLogs, total] = await Promise.all([
        this.prisma.travelLog.findMany({
          where: { userId: targetUserId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.travelLog.count({ where: { userId: targetUserId } }),
      ]);

      return {
        data: travelLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // 친구 관계 확인
    const isFriend = await this.friendshipService.areFriends(
      currentUserId,
      targetUserId,
    );

    // 조회 가능한 visibility 결정
    const visibilityCondition: any = { userId: targetUserId };
    if (isFriend) {
      visibilityCondition.visibility = {
        in: [ShareVisibility.PUBLIC, ShareVisibility.FRIENDS],
      };
    } else {
      visibilityCondition.visibility = ShareVisibility.PUBLIC;
    }

    const [travelLogs, total] = await Promise.all([
      this.prisma.travelLog.findMany({
        where: visibilityCondition,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.travelLog.count({ where: visibilityCondition }),
    ]);

    return {
      data: travelLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 공개 범위 변경
  async updateVisibility(
    userId: string,
    travelLogId: string,
    dto: UpdateVisibilityDto,
  ) {
    const travelLog = await this.prisma.travelLog.findUnique({
      where: { id: travelLogId },
    });

    if (!travelLog) {
      throw new NotFoundException('여행 기록을 찾을 수 없습니다.');
    }

    if (travelLog.userId !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const updatedTravelLog = await this.prisma.travelLog.update({
      where: { id: travelLogId },
      data: { visibility: dto.visibility },
    });

    return updatedTravelLog;
  }

  // 여행 기록 공유하기
  async shareTravelLog(
    userId: string,
    travelLogId: string,
    dto: ShareTravelLogDto,
  ) {
    const travelLog = await this.prisma.travelLog.findUnique({
      where: { id: travelLogId },
      select: { id: true, visibility: true, userId: true },
    });

    if (!travelLog) {
      throw new NotFoundException('여행 기록을 찾을 수 없습니다.');
    }

    // 권한 확인
    if (travelLog.visibility === ShareVisibility.PRIVATE) {
      if (travelLog.userId !== userId) {
        throw new ForbiddenException('비공개 여행 기록입니다.');
      }
    } else if (travelLog.visibility === ShareVisibility.FRIENDS) {
      if (travelLog.userId !== userId) {
        const isFriend = await this.friendshipService.areFriends(
          userId,
          travelLog.userId,
        );
        if (!isFriend) {
          throw new ForbiddenException('친구만 볼 수 있는 여행 기록입니다.');
        }
      }
    }

    // 특정 친구에게 공유하는 경우 친구 관계 확인
    if (dto.sharedWith) {
      const isFriend = await this.friendshipService.areFriends(
        userId,
        dto.sharedWith,
      );
      if (!isFriend) {
        throw new BadRequestException('친구에게만 공유할 수 있습니다.');
      }
    }

    // 공유 생성
    const share = await this.prisma.$transaction(async (tx) => {
      const newShare = await tx.travelLogShare.create({
        data: {
          userId,
          travelLogId,
          sharedWith: dto.sharedWith,
          shareType: dto.shareType,
          message: dto.message,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
          travelLog: {
            select: {
              id: true,
              placeName: true,
              country: true,
              photos: true,
            },
          },
        },
      });

      // shareCount 증가
      await tx.travelLog.update({
        where: { id: travelLogId },
        data: { shareCount: { increment: 1 } },
      });

      return newShare;
    });

    return share;
  }

  // 나와 공유된 여행 기록 목록
  async getSharedWithMe(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [shares, total] = await Promise.all([
      this.prisma.travelLogShare.findMany({
        where: { sharedWith: userId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
          travelLog: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.travelLogShare.count({ where: { sharedWith: userId } }),
    ]);

    return {
      data: shares,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 조회수 증가
  async incrementViewCount(travelLogId: string) {
    await this.prisma.travelLog.update({
      where: { id: travelLogId },
      data: { viewCount: { increment: 1 } },
    });

    return { message: '조회수가 증가했습니다.' };
  }
}
