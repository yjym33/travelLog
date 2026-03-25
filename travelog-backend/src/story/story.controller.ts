import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('스토리')
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스토리 생성' })
  @ApiResponse({ status: 201, description: '스토리 생성 성공' })
  create(
    @GetUser('userId') userId: string,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    return this.storyService.create(userId, createStoryDto);
  }

  @Get('public')
  @ApiOperation({ summary: '공개 스토리 목록 조회' })
  @ApiResponse({ status: 200, description: '공개 스토리 목록 조회 성공' })
  findPublicStories() {
    return this.storyService.findPublicStories();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 스토리 목록 조회' })
  @ApiResponse({ status: 200, description: '스토리 목록 조회 성공' })
  findAll(@GetUser('userId') userId: string) {
    return this.storyService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스토리 상세 조회' })
  @ApiResponse({ status: 200, description: '스토리 조회 성공' })
  @ApiResponse({ status: 404, description: '스토리를 찾을 수 없음' })
  findOne(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.storyService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스토리 수정' })
  @ApiResponse({ status: 200, description: '스토리 수정 성공' })
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    return this.storyService.update(id, userId, updateStoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스토리 삭제' })
  @ApiResponse({ status: 200, description: '스토리 삭제 성공' })
  remove(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.storyService.remove(id, userId);
  }
}



