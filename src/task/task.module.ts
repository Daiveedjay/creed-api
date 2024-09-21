import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { BullModule } from '@nestjs/bull';
import { TaskProcessor } from './task.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'taskEmailQueue'
    })
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskProcessor]
})
export class TaskModule { }
