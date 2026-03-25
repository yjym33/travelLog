import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  // 여행 기록 좋아요 토글
  async toggleTravelLogLike(userId: string, travelLogId: string) {
    // 여행 기록 존재 확인
    const travelLog = await this.prisma.travelLog.findUnique({
      where: { id: travelLogId },
      select: { id: true, allowLikes: true, userId: true },
    });

    if (!travelLog) {
      throw new NotFoundException('여행 기록을 찾을 수 없습니다.');
    }

    if (!travelLog.allowLikes) {
      throw new BadRequestException(
        '이 여행 기록은 좋아요를 허용하지 않습니다.',
      );
    }

    // 기존 좋아요 확인
    const existingLike = await this.prisma.travelLogLike.findUnique({
      where: {
        travelLogId_userId: {
          travelLogId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 좋아요 삭제
      await this.prisma.$transaction([
        this.prisma.travelLogLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.travelLog.update({
          where: { id: travelLogId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      return {
        liked: false,
        message: '좋아요를 취소했습니다.',
      };
    } else {
      // 좋아요 생성
      await this.prisma.$transaction([
        this.prisma.travelLogLike.create({
          data: {
            userId,
            travelLogId,
          },
        }),
        this.prisma.travelLog.update({
          where: { id: travelLogId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      return {
        liked: true,
        message: '좋아요를 눌렀습니다.',
      };
    }
  }

  // 댓글 좋아요 토글
  async toggleCommentLike(userId: string, commentId: string) {
    // 댓글 존재 확인
    const comment = await this.prisma.travelLogComment.findUnique({
      where: { id: commentId },
      select: { id: true, isDeleted: true },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('삭제된 댓글입니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 좋아요 삭제
      await this.prisma.$transaction([
        this.prisma.commentLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.travelLogComment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      return {
        liked: false,
        message: '좋아요를 취소했습니다.',
      };
    } else {
      // 좋아요 생성
      await this.prisma.$transaction([
        this.prisma.commentLike.create({
          data: {
            userId,
            commentId,
          },
        }),
        this.prisma.travelLogComment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      return {
        liked: true,
        message: '좋아요를 눌렀습니다.',
      };
    }
  }

  // 여행 기록 좋아요 목록
  async getTravelLogLikes(
    travelLogId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.travelLogLike.findMany({
        where: { travelLogId },
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
      this.prisma.travelLogLike.count({
        where: { travelLogId },
      }),
    ]);

    return {
      data: likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 내가 좋아요한 여행 기록 목록
  async getMyLikes(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.travelLogLike.findMany({
        where: { userId },
        include: {
          travelLog: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.travelLogLike.count({
        where: { userId },
      }),
    ]);

    return {
      data: likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 좋아요 여부 확인 (단일)
  async checkIfLiked(userId: string, travelLogId: string): Promise<boolean> {
    const like = await this.prisma.travelLogLike.findUnique({
      where: {
        travelLogId_userId: {
          travelLogId,
          userId,
        },
      },
    });

    return !!like;
  }

  // 좋아요 여부 확인 (여러 개)
  async checkIfLikedBatch(
    userId: string,
    travelLogIds: string[],
  ): Promise<Record<string, boolean>> {
    const likes = await this.prisma.travelLogLike.findMany({
      where: {
        userId,
        travelLogId: { in: travelLogIds },
      },
      select: { travelLogId: true },
    });

    const likedMap: Record<string, boolean> = {};
    travelLogIds.forEach((id) => {
      likedMap[id] = false;
    });
    likes.forEach((like) => {
      likedMap[like.travelLogId] = true;
    });

    return likedMap;
  }
}
