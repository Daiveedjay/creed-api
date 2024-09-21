import { Module } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { UserModule } from 'src/user/user.module';
import { DomainModule } from 'src/domain/domain.module';
import { AnnouncementsModule } from 'src/announcements/announcements.module';
import { BullModule } from '@nestjs/bull';
import { CollaboratorProcessor } from './collaborators.processor';
@Module({
  imports: [UserModule, DomainModule, AnnouncementsModule,
    BullModule.registerQueue({
      name: 'collaboratorEmailQueue'
    })
  ],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService, CollaboratorProcessor],
})
export class CollaboratorsModule { }
