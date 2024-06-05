import { Module } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { UserModule } from 'src/user/user.module';
import { DomainModule } from 'src/domain/domain.module';
@Module({
  imports: [UserModule, DomainModule],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
})
export class CollaboratorsModule {}
