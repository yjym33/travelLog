import { IsEnum } from 'class-validator';
import { ShareVisibility } from '@prisma/client';

export class UpdateVisibilityDto {
  @IsEnum(ShareVisibility)
  visibility: ShareVisibility;
}
