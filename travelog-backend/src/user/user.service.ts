import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        createdAt: true,
        _count: {
          select: {
            travelLogs: true,
            stories: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
      },
    });

    return user;
  }

  async remove(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '사용자가 삭제되었습니다.' };
  }

  async getStats(userId: string) {
    const stats = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            travelLogs: true,
            stories: true,
          },
        },
        travelLogs: {
          select: {
            country: true,
            emotion: true,
          },
        },
      },
    });

    if (!stats) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const uniqueCountries = [
      ...new Set(stats.travelLogs.map((log) => log.country)),
    ];
    const emotionDistribution = stats.travelLogs.reduce(
      (acc, log) => {
        acc[log.emotion] = (acc[log.emotion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalTravelLogs: stats._count.travelLogs,
      totalStories: stats._count.stories,
      uniqueCountries: uniqueCountries.length,
      countries: uniqueCountries,
      emotionDistribution,
    };
  }
}



