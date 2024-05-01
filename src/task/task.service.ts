import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO } from './task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly dbService: DbService) {}

  async getTasks(panelID: string) {
    try {
      const tasks = await this.dbService.task.findMany({
        where: {
          panelId: panelID,
        },
      });

      return tasks;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getTask(domainID: string, panelID: string, taskID: string) {
    try {
      const task = await this.dbService.task.findFirst({
        where: { 
          id: taskID,
          domainId: domainID,
          panelId: panelID,
        },
      });

      return task;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async createTask(
    domainID: string,
    panelID: string,
    userId: string,
    dto: CreateTaskDTO,
  ) {
    try {
      const tasks = await this.dbService.task.create({
        data: {
          description: dto.description,
          text: dto.text,
          statusId: dto.statusId,
          subTasks: dto.subTasks,
          authorId: userId,
          panelId: panelID,
          domainId: domainID,
        },
      });

      return tasks;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async editTask(domainID: string, taskID: string, dto: CreateTaskDTO) {
    // await this.dbService.task.update({ where: { domainId, id: taskID }, data: { ...dto } });
    return {
      message: 'Updated',
    };
  }

  async deleteTask(doaminID: string, taskID: string) {
    // await this.dbService.task.delete({ where: { domainId: doaminID, id: taskID } });
    return {
      message: 'Deleted',
    };
  }
}
