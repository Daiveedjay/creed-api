import { Module } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { UserModule } from 'src/user/user.module';
import { DomainModule } from 'src/domain/domain.module';
import { AnnouncementsModule } from 'src/announcements/announcements.module';
@Module({
  imports: [UserModule, DomainModule, AnnouncementsModule],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
})
export class CollaboratorsModule { }
