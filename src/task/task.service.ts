import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO } from './task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly dbService: DbService) { }

  async getTasks(domainID: string) {
    const tasks = await this.dbService.task.findMany({ where: {  } });
    return tasks;
  }

  async getTask(panelID: string, taskID: string) {
    const tasks = await this.dbService.task.findFirst({ where: { id: taskID } });
    return tasks;
  }

  async createTask(domainID: string, dto: CreateTaskDTO) {
    // const tasks = await this.dbService.task.create({
    //   data: {
    //     name: dto.name,
    //     domainId: domainID
    //   }
    // });
    // return tasks;
  }

  async editTask(domainID: string, taskID: string, dto: CreateTaskDTO) {
    // await this.dbService.task.update({ where: { domainId, id: taskID }, data: { ...dto } });
    return {
      message: "Updated",
    }
  }

  async deleteTask(doaminID: string, taskID: string) {
    // await this.dbService.task.delete({ where: { domainId: doaminID, id: taskID } });
    return {
      message: "Deleted",
    }
  }  
}
