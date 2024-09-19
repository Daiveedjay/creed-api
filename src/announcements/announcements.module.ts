import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { DomainModule } from 'src/domain/domain.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DomainModule, UserModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService]
})
export class AnnouncementsModule { }
