import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';

@Injectable()
export class FriendshipService {
  constructor(private prisma: PrismaService) {}

  // 친구 요청 보내기
  async sendFriendRequest(requesterId: string, addresseeId: string) {
    // 자기 자신에게 친구 요청 불가
    if (requesterId === addresseeId) {
      throw new BadRequestException(
        '자기 자신에게 친구 요청을 할 수 없습니다.',
      );
    }

    // 수신자 존재 확인
    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
      select: { id: true, allowFriendRequests: true },
    });

    if (!addressee) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!addressee.allowFriendRequests) {
      throw new BadRequestException('해당 사용자는 친구 요청을 받지 않습니다.');
    }

    // 기존 친구 관계 확인 (양방향)
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('이미 친구입니다.');
      }
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new ConflictException('이미 친구 요청이 대기 중입니다.');
      }
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('차단된 사용자입니다.');
      }
    }

    // 친구 요청 생성
    const friendship = await this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            nickname: true,
            profileImage: true,
          },
        },
        addressee: {
          select: {
            id: true,
            email: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return friendship;
  }

  // 친구 요청 수락
  async acceptFriendRequest(userId: string, requestId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    // 요청 받은 사람만 수락 가능
    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('권한이 없습니다.');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    // 트랜잭션으로 처리
    const [updatedFriendship] = await this.prisma.$transaction([
      this.prisma.friendship.update({
        where: { id: requestId },
        data: {
          status: FriendshipStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
            },
          },
          addressee: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
            },
          },
        },
      }),
      // 양쪽 사용자의 friendsCount 증가
      this.prisma.user.update({
        where: { id: friendship.requesterId },
        data: { friendsCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: friendship.addresseeId },
        data: { friendsCount: { increment: 1 } },
      }),
    ]);

    return updatedFriendship;
  }

  // 친구 요청 거절
  async rejectFriendRequest(userId: string, requestId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('권한이 없습니다.');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    const updatedFriendship = await this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: FriendshipStatus.REJECTED },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            nickname: true,
            profileImage: true,
          },
        },
        addressee: {
          select: {
            id: true,
            email: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return updatedFriendship;
  }

  // 친구 목록 조회
  async getFriends(
    userId: string,
    status?: FriendshipStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    };

    if (status) {
      where.status = status;
    }

    const [friendships, total] = await Promise.all([
      this.prisma.friendship.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
              friendsCount: true,
            },
          },
          addressee: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
              friendsCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.friendship.count({ where }),
    ]);

    return {
      data: friendships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 받은 친구 요청 목록
  async getReceivedRequests(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: FriendshipStatus.PENDING,
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
              friendsCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.friendship.count({
        where: {
          addresseeId: userId,
          status: FriendshipStatus.PENDING,
        },
      }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 보낸 친구 요청 목록
  async getSentRequests(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          requesterId: userId,
          status: FriendshipStatus.PENDING,
        },
        include: {
          addressee: {
            select: {
              id: true,
              email: true,
              nickname: true,
              profileImage: true,
              friendsCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.friendship.count({
        where: {
          requesterId: userId,
          status: FriendshipStatus.PENDING,
        },
      }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 친구 삭제
  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    // 본인과 관련된 친구 관계인지 확인
    if (
      friendship.requesterId !== userId &&
      friendship.addresseeId !== userId
    ) {
      throw new BadRequestException('권한이 없습니다.');
    }

    // 수락된 친구 관계인 경우 friendsCount 감소
    if (friendship.status === FriendshipStatus.ACCEPTED) {
      await this.prisma.$transaction([
        this.prisma.friendship.delete({ where: { id: friendshipId } }),
        this.prisma.user.update({
          where: { id: friendship.requesterId },
          data: { friendsCount: { decrement: 1 } },
        }),
        this.prisma.user.update({
          where: { id: friendship.addresseeId },
          data: { friendsCount: { decrement: 1 } },
        }),
      ]);
    } else {
      await this.prisma.friendship.delete({ where: { id: friendshipId } });
    }

    return { message: '친구 관계가 삭제되었습니다.' };
  }

  // 사용자 검색
  async searchUsers(
    query: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } },
            { isPublicProfile: true },
            {
              OR: [
                { nickname: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          bio: true,
          location: true,
          friendsCount: true,
        },
        orderBy: { friendsCount: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          AND: [
            { id: { not: currentUserId } },
            { isPublicProfile: true },
            {
              OR: [
                { nickname: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
    ]);

    // 각 사용자와의 친구 관계 상태 확인
    const usersWithFriendshipStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await this.prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: currentUserId, addresseeId: user.id },
              { requesterId: user.id, addresseeId: currentUserId },
            ],
          },
          select: { id: true, status: true, requesterId: true },
        });

        return {
          ...user,
          friendshipStatus: friendship?.status || null,
          friendshipId: friendship?.id || null,
          isRequester: friendship?.requesterId === currentUserId,
        };
      }),
    );

    return {
      data: usersWithFriendshipStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 두 사용자가 친구인지 확인
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: userId1,
            addresseeId: userId2,
            status: FriendshipStatus.ACCEPTED,
          },
          {
            requesterId: userId2,
            addresseeId: userId1,
            status: FriendshipStatus.ACCEPTED,
          },
        ],
      },
    });

    return !!friendship;
  }

  // 친구 관계 상태 조회
  async getFriendshipStatus(userId1: string, userId2: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 },
        ],
      },
      select: {
        id: true,
        status: true,
        requesterId: true,
        addresseeId: true,
      },
    });

    if (!friendship) {
      return { status: null, friendshipId: null, isRequester: false };
    }

    return {
      status: friendship.status,
      friendshipId: friendship.id,
      isRequester: friendship.requesterId === userId1,
    };
  }
}
