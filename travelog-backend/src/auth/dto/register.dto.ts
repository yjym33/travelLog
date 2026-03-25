import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: 'password123', description: '비밀번호 (최소 6자)' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({
    example: '여행가',
    description: '닉네임 (2-20자)',
    required: false,
  })
  @ValidateIf((o) => o.nickname !== undefined)
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  nickname?: string;

  // username 필드도 허용 (nickname과 동일한 유효성 검사)
  @ApiProperty({
    example: '여행가',
    description: '사용자명 (2-20자)',
    required: false,
  })
  @ValidateIf((o) => o.username !== undefined)
  @IsString()
  @MinLength(2, { message: '사용자명은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다.' })
  username?: string;
}



