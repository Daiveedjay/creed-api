import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DomainModule } from 'src/domain/domain.module';
import { TaskModule } from 'src/task/task.module';
import { PanelModule } from 'src/panel/panel.module';
import { StatusModule } from 'src/status/status.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DomainModule, TaskModule, PanelModule, StatusModule, UserModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule { }
