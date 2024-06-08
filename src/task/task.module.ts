import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { NotifyModule } from 'src/notify/notify.module';

@Module({
  imports: [NotifyModule],
  controllers: [TaskController],
  providers: [TaskService]
})
export class TaskModule {}
