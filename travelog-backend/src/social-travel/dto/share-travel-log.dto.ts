import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ShareType } from '@prisma/client';

export class ShareTravelLogDto {
  @IsOptional()
  @IsUUID()
  sharedWith?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsEnum(ShareType)
  shareType: ShareType;
}
