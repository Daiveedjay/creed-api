import { Module } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { UserModule } from 'src/user/user.module';
import { DomainModule } from 'src/domain/domain.module';
import { NotifyModule } from 'src/notify/notify.module';
@Module({
  imports: [UserModule, DomainModule, NotifyModule],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
})
export class CollaboratorsModule {}
