/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
        }
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
        }
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
          id: userId
        }
      })

      if(!currentUser) throw new NotFoundException('No user found!')

      const tasks = await this.dbService.task.create({
        data: {
          description: dto.description,
          text: dto.text,
          statusId: dto.statusId,
          subTasks: {
            createMany: {
              data: dto.subTasks.map(task => ({
                text: task.content,
                done: false,
                authorId: currentUser.id
              }))
            }
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

  async editTask(domainID: string, taskID: string, dto: UpdateTaskDto) {
    await this.dbService.task.update({ where: { domainId: domainID, id: taskID }, data: {
      ...dto,
      subTasks: {
        updateMany: {
          where: {
            id: dto.subTasksId
          },
          data: dto.subTasks.map((task) => ({
            text: task.content
          }))
        }
      }
    } });
    return {
      message: 'Updated',
    };
  }

  async deleteTask(doaminID: string, taskID: string) {
    await this.dbService.task.delete({ where: { domainId: doaminID, id: taskID } });
    return {
      message: 'Deleted',
    };
  }
}
