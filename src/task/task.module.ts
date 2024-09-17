import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { BullModule } from '@nestjs/bull';
@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'emailQueue'
    })
  ],
  controllers: [TaskController],
  providers: [TaskService]
})
export class TaskModule { }
