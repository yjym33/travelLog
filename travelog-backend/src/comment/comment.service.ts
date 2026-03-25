import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentSort } from './dto/get-comments.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  // 댓글 작성
  async createComment(userId: string, dto: CreateCommentDto) {
    // 여행 기록 존재 확인
    const travelLog = await this.prisma.travelLog.findUnique({
      where: { id: dto.travelLogId },
      select: { id: true, allowComments: true },
    });

    if (!travelLog) {
      throw new NotFoundException('여행 기록을 찾을 수 없습니다.');
    }

    if (!travelLog.allowComments) {
      throw new BadRequestException('이 여행 기록은 댓글을 허용하지 않습니다.');
    }

    // 부모 댓글 확인 (대댓글인 경우)
    if (dto.parentId) {
      const parentComment = await this.prisma.travelLogComment.findUnique({
        where: { id: dto.parentId },
        select: {
          id: true,
          travelLogId: true,
          isDeleted: true,
          parentId: true,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      }

      if (parentComment.travelLogId !== dto.travelLogId) {
        throw new BadRequestException(
          '다른 여행 기록의 댓글에 답글을 달 수 없습니다.',
        );
      }

      if (parentComment.isDeleted) {
        throw new BadRequestException('삭제된 댓글에 답글을 달 수 없습니다.');
      }

      // 대댓글의 대댓글 방지 (최대 2단계까지만)
      if (parentComment.parentId) {
        throw new BadRequestException('대댓글에는 답글을 달 수 없습니다.');
      }
    }

    // 댓글 생성
    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await tx.travelLogComment.create({
        data: {
          userId,
          travelLogId: dto.travelLogId,
          parentId: dto.parentId,
          content: dto.content,
        },
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
      });

      // 여행 기록의 commentCount 증가
      await tx.travelLog.update({
        where: { id: dto.travelLogId },
        data: { commentCount: { increment: 1 } },
      });

      // 부모 댓글의 replyCount 증가
      if (dto.parentId) {
        await tx.travelLogComment.update({
          where: { id: dto.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      return newComment;
    });

    return comment;
  }

  // 댓글 목록 조회
  async getComments(
    travelLogId: string,
    page: number = 1,
    limit: number = 20,
    sort: CommentSort = CommentSort.CREATED_ASC,
  ) {
    const skip = (page - 1) * limit;

    // 정렬 설정
    let orderBy: any = { createdAt: 'asc' };
    if (sort === CommentSort.CREATED_DESC) {
      orderBy = { createdAt: 'desc' };
    } else if (sort === CommentSort.LIKES_DESC) {
      orderBy = { likeCount: 'desc' };
    }

    // 최상위 댓글만 조회 (parentId가 null)
    const [comments, total] = await Promise.all([
      this.prisma.travelLogComment.findMany({
        where: {
          travelLogId,
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
            },
          },
          replies: {
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
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.travelLogComment.count({
        where: {
          travelLogId,
          parentId: null,
        },
      }),
    ]);

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 대댓글 목록 조회
  async getReplies(commentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.travelLogComment.findMany({
        where: { parentId: commentId },
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
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.travelLogComment.count({
        where: { parentId: commentId },
      }),
    ]);

    return {
      data: replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 댓글 수정
  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.travelLogComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('댓글을 수정할 권한이 없습니다.');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('삭제된 댓글은 수정할 수 없습니다.');
    }

    const updatedComment = await this.prisma.travelLogComment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        isEdited: true,
      },
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
    });

    return updatedComment;
  }

  // 댓글 삭제 (Soft Delete)
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.travelLogComment.findUnique({
      where: { id: commentId },
      include: {
        travelLog: { select: { id: true } },
      },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('이미 삭제된 댓글입니다.');
    }

    // Soft delete
    await this.prisma.$transaction(async (tx) => {
      await tx.travelLogComment.update({
        where: { id: commentId },
        data: {
          content: '삭제된 댓글입니다.',
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 여행 기록의 commentCount 감소
      await tx.travelLog.update({
        where: { id: comment.travelLogId },
        data: { commentCount: { decrement: 1 } },
      });

      // 부모 댓글의 replyCount 감소
      if (comment.parentId) {
        await tx.travelLogComment.update({
          where: { id: comment.parentId },
          data: { replyCount: { decrement: 1 } },
        });
      }
    });

    return { message: '댓글이 삭제되었습니다.' };
  }

  // 내가 작성한 댓글 목록
  async getMyComments(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.travelLogComment.findMany({
        where: {
          userId,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.travelLogComment.count({
        where: {
          userId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
