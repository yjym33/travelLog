import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('사용자')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  getMe(@GetUser('userId') userId: string) {
    return this.userService.findOne(userId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: '내 통계 조회' })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  getMyStats(@GetUser('userId') userId: string) {
    return this.userService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({ status: 200, description: '정보 수정 성공' })
  update(
    @GetUser('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  remove(@GetUser('userId') userId: string) {
    return this.userService.remove(userId);
  }
}



