import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmTokenEntity } from './fcm_token.entity';
import { AnnouncementEntity } from './announcement.entity';
import { FcmService } from './fcm.service';
import { AnnouncementService } from './announcement.service';
import { FcmController } from './fcm.controller';
import { AdminAnnouncementController } from './admin/admin.announcement.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([FcmTokenEntity, AnnouncementEntity]),
    ConfigModule,
  ],
  controllers: [FcmController, AdminAnnouncementController],
  providers: [FcmService, AnnouncementService],
  exports: [FcmService],
})
export class FcmModule {}
