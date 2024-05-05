/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO, UpdateTaskDto } from './task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly dbService: DbService) {}

  async getTasks(domainID: string, panelID: string) {
    try {
      const tasks = await this.dbService.task.findMany({
        where: {
          domainId: domainID,
          panelId: panelID,
        },
        select: {
          id: true,
          text: true,
          description: true,
          createdAt: true,
          subTasks: true,
          authorId: true,
          domainId: true,
          panelId: true,
          statusId: true,
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
        select: {
          id: true,
          text: true,
          description: true,
          createdAt: true,
          subTasks: true,
          authorId: true,
          domainId: true,
          panelId: true,
          statusId: true,
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
      const currentUser = await this.dbService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!currentUser) throw new NotFoundException('No user found!');

      const tasks = await this.dbService.task.create({
        data: {
          description: dto.description,
          text: dto.title,
          statusId: dto.statusId,
          subTasks: {
            createMany: {
              data: dto.subTasks.map((task) => ({
                text: task.content,
                done: false,
                authorId: currentUser.id,
              })),
            },
          },
          authorId: currentUser.id,
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

  async editTask(
    domainID: string,
    panelID: string,
    taskID: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    const thereIsATask = await this.dbService.task.findUnique({
      where: {
        id: taskID,
        panelId: panelID,
        domainId: domainID,
      },
      select: {
        subTasks: true,
        id: true,
      },
    });

    if (!thereIsATask) throw new NotFoundException('Task not found');

    await this.dbService.task.update({
      where: {
        id: taskID,
        domainId: domainID,
        panelId: panelID,
      },
      data: {
        ...dto,
        subTasks: {
          upsert: dto.subTasks.map((subtask) => ({
            where: {
              id: subtask.id,
            },
            update: {
              done: subtask.done,
              text: subtask.content,
            },
            create: {
              done: subtask.done,
              text: subtask.content,
              authorId: userId,
            },
          })),
        },
      },
    });

    return new HttpException('Updated', HttpStatus.ACCEPTED);
  }

  async deleteTask(doaminID: string, taskID: string, panelID: string) {
    try {
      const existingTask = await this.dbService.task.findUnique({
        where: { domainId: doaminID, id: taskID, panelId: panelID },
      });

      if(!existingTask) throw new NotFoundException('Task not found!')

      await this.dbService.task.delete({
        where: { domainId: doaminID, id: taskID, panelId: panelID },
      });
      
      return new HttpException('Deleted', HttpStatus.ACCEPTED)
    } catch (error) {
      throw new InternalServerErrorException()
    }
    
  }
}
