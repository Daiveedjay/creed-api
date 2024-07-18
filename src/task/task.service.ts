/* eslint-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO, UpdateMultipleTasksDto, UpdateTaskDto } from './task.dto';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class TaskService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly dbService: DbService,
  ) { }

  async getTasks(domainID: string, panelID: string) {
    try {
      const tasks = await this.dbService.task.findMany({
        where: {
          domainId: domainID,
          panelId: panelID,
        },
        select: {
          id: true,
          title: true,
          order: true,
          assignedTo: true,
          assignedFrom: true,
          assignedCollaborators: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true,
                }
              }
            }
          },
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
      throw new ConflictException(error.message)
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
          title: true,
          description: true,
          order: true,
          assignedTo: true,
          assignedFrom: true,
          assignedCollaborators: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true,
                }
              }
            }
          },
          createdAt: true,
          subTasks: true,
          authorId: true,
          domainId: true,
          panelId: true,
          statusId: true,
        },
      });

      if (!task) throw new NotFoundException('No task like this!')

      return task;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
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
          title: dto.title,
          order: dto.order,
          statusId: dto.statusId,
          assignedFrom: dto.assignedFrom ? dto.assignedFrom : '',
          assignedTo: dto.assignedTo ? dto.assignedTo : '',
          subTasks: {
            createMany: {
              data: dto.subTasks.map((task) => ({
                title: task.title,
                done: false,
                authorId: currentUser.id,
              })),
            },
          },
          authorId: currentUser.id,
          panelId: panelID,
          domainId: domainID,
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          assignedTo: true,
          assignedFrom: true,
          assignedCollaborators: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true,
                }
              }
            }
          },
          createdAt: true,
          subTasks: true,
          authorId: true,
          domainId: true,
          panelId: true,
          statusId: true,
        }
      });

      if (dto.usersToAssignIds.length !== 0) {
        const users = await this.dbService.domainMembership.findMany({
          where: {
            userId: {
              in: dto.usersToAssignIds
            },
            domainId: domainID,
          }
        })

        const inPanels = await this.dbService.panelMembership.findMany({
          where: {
            userId: {
              in: dto.usersToAssignIds
            },
            domainId: domainID,
            panelId: panelID,
          }
        })

        if (users.length === 0 || inPanels.length === 0) throw new ConflictException('Users are either not in this domain or do not have access to this panel');

        const assignedUsers = await this.dbService.assignedCollaborators.createMany({
          data: users.map((user) => ({
            userId: user.userId,
            taskId: tasks.id,
          }))
        })

        if (assignedUsers.count === 0) throw new ConflictException('Could not assign these users!')

        const tasksWithMentions = await this.getTask(domainID, panelID, tasks.id)

        this.notificationGateway.sendNotification({ domain: domainID, message: 'You might wanna refresh though' })

        return tasksWithMentions;
      }

      this.notificationGateway.sendNotification({ domain: domainID, message: 'You might wanna refresh though' })
      return tasks;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async editTask(
    domainID: string,
    panelID: string,
    taskID: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    const adminInDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainID,
        domainMembers: {
          some: {
            id: userId,
            memberRole: 'admin',
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

    if (dto.title || dto.description || dto.statusId) {
      existingTask.title = dto.title;
      existingTask.description = dto.description;
      existingTask.statusId = dto.statusId
    }

    if (dto.subTasks) {
      for (const subtaskData of dto.subTasks) {
        const existingSubtask = existingTask.subTasks.find(
          (subtask) => subtask.id === subtaskData.id,
        );

        if (!existingSubtask) {
          await this.dbService.subTask.create({
            data: {
              title: subtaskData.title,
              done: false,
              authorId: userId,
              parentTaskId: existingTask.id,
            },
          });
        }

        await this.dbService.subTask.update({
          where: {
            id: existingSubtask.id,
            parentTaskId: existingTask.id
          },
          data: {
            done: subtaskData.done,
            title: subtaskData.title
          }
        })
      }
    }

    const updatedTask = await this.dbService.task.update({
      where: {
        id: taskID,
        panelId: panelID,
        domainId: domainID,
        // authorId: userId
      },
      data: {
        title: existingTask.title,
        description: existingTask.description,
        statusId: existingTask.statusId
      },
      include: {
        subTasks: true,
        Status: true
      }
    });

    this.notificationGateway.sendNotification({ domain: domainID, message: 'You might wanna refresh though' })

    return updatedTask;

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
        include: {
          assignedCollaborators: true,
          subTasks: true
        },
      });

      if (!existingTask) throw new NotFoundException('Task not found!');

      if (existingTask.subTasks) {
        for (const subTasks of existingTask.subTasks) {
          await this.dbService.subTask.delete({
            where: {
              id: subTasks.id
            }
          })
        }

      }

      if (existingTask.assignedCollaborators) {
        for (const collaborators of existingTask.assignedCollaborators) {
          await this.dbService.assignedCollaborators.delete({
            where: {
              id: collaborators.id
            }
          })
        }
      }

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

  async editMultipleTasks(
    domainID: string,
    userId: string,
    panelID: string,
    tasksDto: UpdateMultipleTasksDto[]
  ) {
    const updatedTasks = []
    for (const task of tasksDto) {
      const { id, ...otherDetails } = task
      const updated = await this.editTask(domainID, panelID, task.id, userId, otherDetails)
      updatedTasks.push(updated)
    }

    return updatedTasks;
  }
}


