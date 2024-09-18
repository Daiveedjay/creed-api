import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { BullModule } from '@nestjs/bull';
import { AppProcessor } from 'src/app.processor';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue'
    })
  ],
  controllers: [TaskController],
  providers: [TaskService, AppProcessor]
})
export class TaskModule { }
