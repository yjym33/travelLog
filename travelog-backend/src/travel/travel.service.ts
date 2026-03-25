import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { FilterTravelDto } from './dto/filter-travel.dto';

@Injectable()
export class TravelService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTravelDto: CreateTravelDto) {
    const travelLog = await this.prisma.travelLog.create({
      data: {
        ...createTravelDto,
        userId,
        tags: createTravelDto.tags || [],
      },
    });

    return travelLog;
  }

  async findAll(userId: string, filterDto?: FilterTravelDto) {
    const where: any = { userId };

    if (filterDto) {
      // 감정 필터
      if (filterDto.emotions) {
        const emotionArray = filterDto.emotions.split(',');
        where.emotion = { in: emotionArray };
      }

      // 국가 필터
      if (filterDto.countries) {
        const countryArray = filterDto.countries.split(',');
        where.country = { in: countryArray };
      }

      // 태그 필터
      if (filterDto.tags) {
        const tagArray = filterDto.tags.split(',');
        where.tags = { hasSome: tagArray };
      }

      // 날짜 범위 필터
      if (filterDto.startDate || filterDto.endDate) {
        where.createdAt = {};
        if (filterDto.startDate) {
          where.createdAt.gte = new Date(filterDto.startDate);
        }
        if (filterDto.endDate) {
          where.createdAt.lte = new Date(filterDto.endDate);
        }
      }
    }

    const travelLogs = await this.prisma.travelLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return travelLogs;
  }

  async findOne(id: string, userId: string) {
    const travelLog = await this.prisma.travelLog.findUnique({
      where: { id },
    });

    if (!travelLog) {
      throw new NotFoundException('여행 기록을 찾을 수 없습니다.');
    }

    if (travelLog.userId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return travelLog;
  }

  async update(id: string, userId: string, updateTravelDto: UpdateTravelDto) {
    // 권한 확인
    await this.findOne(id, userId);

    const travelLog = await this.prisma.travelLog.update({
      where: { id },
      data: updateTravelDto,
    });

    return travelLog;
  }

  async remove(id: string, userId: string) {
    // 권한 확인
    await this.findOne(id, userId);

    await this.prisma.travelLog.delete({
      where: { id },
    });

    return { message: '여행 기록이 삭제되었습니다.' };
  }

  async getStatistics(userId: string) {
    const travelLogs = await this.prisma.travelLog.findMany({
      where: { userId },
      select: {
        country: true,
        emotion: true,
        createdAt: true,
      },
    });

    const totalLogs = travelLogs.length;
    const uniqueCountries = [...new Set(travelLogs.map((log) => log.country))];

    const emotionDistribution = travelLogs.reduce(
      (acc, log) => {
        acc[log.emotion] = (acc[log.emotion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const countryDistribution = travelLogs.reduce(
      (acc, log) => {
        acc[log.country] = (acc[log.country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 월별 여행 횟수
    const monthlyTravels = travelLogs.reduce(
      (acc, log) => {
        const month = log.createdAt.toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalLogs,
      uniqueCountries: uniqueCountries.length,
      countries: uniqueCountries,
      emotionDistribution,
      countryDistribution,
      monthlyTravels,
    };
  }
}



