import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';

@Injectable()
export class StoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createStoryDto: CreateStoryDto) {
    const { travelLogIds, ...storyData } = createStoryDto;

    // 여행 기록들이 사용자의 것인지 확인
    const travelLogs = await this.prisma.travelLog.findMany({
      where: {
        id: { in: travelLogIds },
        userId,
      },
    });

    if (travelLogs.length !== travelLogIds.length) {
      throw new ForbiddenException(
        '일부 여행 기록에 대한 접근 권한이 없습니다.',
      );
    }

    // 스토리 생성
    const story = await this.prisma.story.create({
      data: {
        ...storyData,
        userId,
        isPublic: createStoryDto.isPublic ?? false,
        storyLogs: {
          create: travelLogIds.map((travelLogId, index) => ({
            travelLogId,
            order: index,
          })),
        },
      },
      include: {
        storyLogs: {
          include: {
            travelLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return story;
  }

  async findAll(userId: string) {
    const stories = await this.prisma.story.findMany({
      where: { userId },
      include: {
        storyLogs: {
          include: {
            travelLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories;
  }

  async findOne(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        storyLogs: {
          include: {
            travelLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException('스토리를 찾을 수 없습니다.');
    }

    if (story.userId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return story;
  }

  async update(id: string, userId: string, updateStoryDto: UpdateStoryDto) {
    // 권한 확인
    await this.findOne(id, userId);

    const { travelLogIds, ...storyData } = updateStoryDto;

    // 여행 기록 업데이트가 있는 경우
    if (travelLogIds) {
      // 기존 storyLogs 삭제
      await this.prisma.storyLog.deleteMany({
        where: { storyId: id },
      });

      // 새로운 storyLogs 생성
      await this.prisma.storyLog.createMany({
        data: travelLogIds.map((travelLogId, index) => ({
          storyId: id,
          travelLogId,
          order: index,
        })),
      });
    }

    // 스토리 데이터 업데이트
    const story = await this.prisma.story.update({
      where: { id },
      data: storyData,
      include: {
        storyLogs: {
          include: {
            travelLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return story;
  }

  async remove(id: string, userId: string) {
    // 권한 확인
    await this.findOne(id, userId);

    await this.prisma.story.delete({
      where: { id },
    });

    return { message: '스토리가 삭제되었습니다.' };
  }

  async findPublicStories() {
    const stories = await this.prisma.story.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        storyLogs: {
          include: {
            travelLog: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories;
  }
}
