import { Module } from '@nestjs/common';
import { SocialTravelController } from './social-travel.controller';
import { SocialTravelService } from './social-travel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendshipModule } from '../friendship/friendship.module';

@Module({
  imports: [PrismaModule, FriendshipModule],
  controllers: [SocialTravelController],
  providers: [SocialTravelService],
  exports: [SocialTravelService],
})
export class SocialTravelModule {}
