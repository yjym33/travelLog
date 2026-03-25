import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TravelService } from './travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { FilterTravelDto } from './dto/filter-travel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('여행 기록')
@Controller('travels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post()
  @ApiOperation({ summary: '여행 기록 생성' })
  @ApiResponse({ status: 201, description: '여행 기록 생성 성공' })
  create(
    @GetUser('userId') userId: string,
    @Body() createTravelDto: CreateTravelDto,
  ) {
    return this.travelService.create(userId, createTravelDto);
  }

  @Get()
  @ApiOperation({ summary: '내 여행 기록 목록 조회' })
  @ApiResponse({ status: 200, description: '여행 기록 목록 조회 성공' })
  findAll(
    @GetUser('userId') userId: string,
    @Query() filterDto: FilterTravelDto,
  ) {
    return this.travelService.findAll(userId, filterDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: '여행 통계 조회' })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  getStatistics(@GetUser('userId') userId: string) {
    return this.travelService.getStatistics(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '여행 기록 상세 조회' })
  @ApiResponse({ status: 200, description: '여행 기록 조회 성공' })
  @ApiResponse({ status: 404, description: '여행 기록을 찾을 수 없음' })
  findOne(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.travelService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '여행 기록 수정' })
  @ApiResponse({ status: 200, description: '여행 기록 수정 성공' })
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() updateTravelDto: UpdateTravelDto,
  ) {
    return this.travelService.update(id, userId, updateTravelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '여행 기록 삭제' })
  @ApiResponse({ status: 200, description: '여행 기록 삭제 성공' })
  remove(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.travelService.remove(id, userId);
  }
}



