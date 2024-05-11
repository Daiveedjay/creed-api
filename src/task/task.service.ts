/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
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
    try {
      const adminInDomain = await this.dbService.domain.findUnique({
        where: {
          id: domainID,
          domainMembers: {
            some: {
              id: userId,
              memberRole: 'Admin',
            },
          },
        },
      });

      console.log(adminInDomain);

      const existingTask = await this.dbService.task.findUnique({
        where: {
          id: taskID,
          panelId: panelID,
          domainId: domainID,
          // authorId: userId
        },
        include: {
          subTasks: true,
        },
      });

      if (!existingTask) {
        throw new NotFoundException('Task not found');
      }

      if (existingTask.authorId !== userId) {
        throw new UnauthorizedException('You do not have this access');
      }

      if (dto.title) {
        existingTask.text = dto.title;
      }
      if (dto.description) {
        existingTask.description = dto.description;
      }

      if (dto.subTasks) {
        for (const subtaskData of dto.subTasks) {
          const existingSubtask = existingTask.subTasks.find(
            (subtask) => subtask.id === subtaskData.id,
          );

          if (!existingSubtask) {
            await this.dbService.subTask.create({
              data: {
                text: subtaskData.content,
                done: false,
                authorId: userId,
                parentTaskId: existingTask.id,
              },
            });
          } else if (subtaskData.content) {
            await this.dbService.subTask.update({
              where: { id: existingSubtask.id },
              data: {
                text: subtaskData.content,
              },
            });
          } else if (subtaskData.done) {
            if (subtaskData.done === true) {
              await this.dbService.subTask.delete({
                where: {
                  id: existingSubtask.id,
                },
              });
            } else {
              await this.dbService.subTask.update({
                where: { id: existingSubtask.id },
                data: {
                  done: subtaskData.done,
                },
              });
            }
          }
        }
      }

      await this.dbService.task.update({
        where: {
          id: taskID,
          panelId: panelID,
          domainId: domainID,
          // authorId: userId
        },
        data: {
          text: existingTask.text,
          description: existingTask.description,
        },
      });

      return new HttpException('Updated', HttpStatus.ACCEPTED);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteTask(
    doaminID: string,
    taskID: string,
    panelID: string,
    userId: string,
  ) {
    try {
      const existingTask = await this.dbService.task.findUnique({
        where: { domainId: doaminID, id: taskID, panelId: panelID },
      });

      if (!existingTask) throw new NotFoundException('Task not found!');

      await this.dbService.task.delete({
        where: {
          domainId: doaminID,
          id: taskID,
          panelId: panelID,
          authorId: userId,
        },
      });

      return new HttpException('Deleted', HttpStatus.ACCEPTED);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
