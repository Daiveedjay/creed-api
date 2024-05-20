import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UtilsModule } from './utils/utils.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DomainModule } from './domain/domain.module';
import { PanelModule } from './panel/panel.module';
import { StatusModule } from './status/status.module';
import { TaskModule } from './task/task.module';
import { CollaboratorsModule } from './collaborators/collaborators.module';
import { CollaboratorModule } from './collaborator/collaborator.module';
@Module({
  imports: [
    AuthModule,
    UtilsModule,
    UserModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DomainModule,
    PanelModule,
    StatusModule,
    TaskModule,
    CollaboratorsModule,
    CollaboratorModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
