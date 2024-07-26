/* eslint-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO, DeleteMultipleTasksDto, UpdateMultipleTasksDto, UpdateTaskDto } from './task.dto';
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
        orderBy: {
          order: 'asc'
        }
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
        orderBy: {
          order: 'asc'
        }
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

      if (dto.assignedFrom || dto.assignedTo) {
        await this.dbService.task.update({
          where: {
            id: tasks.id
          },
          data: {
            assignedFrom: dto.assignedFrom,
            assignedTo: dto.assignedTo
          }
        })
      };

      if (dto.usersToAssignIds?.length !== 0) {
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
          data: users.map((col) => ({
            userId: col.userId,
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
      },
      include: {
        subTasks: true,
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (dto.title || dto.description || dto.statusId || dto.order || dto.assignedFrom || dto.assignedTo) {
      existingTask.title = dto.title;
      existingTask.description = dto.description;
      existingTask.statusId = dto.statusId;
      existingTask.order = dto.order;
      existingTask.assignedTo = dto.assignedTo
      existingTask.assignedFrom = dto.assignedFrom;
    }

    if (dto.subTasks) {
      for (const subtaskData of dto.subTasks) {
        const existingSubtask = existingTask.subTasks.find(
          (subtask) => subtask.id === subtaskData.id,
        );

        //TODO: BE ABLE TO CREATE NEW TASKS FROM EDIT
        if (!existingSubtask) {
          await this.dbService.subTask.create({
            data: {
              title: subtaskData.title,
              done: false,
              authorId: userId,
              parentTaskId: existingTask.id,
            },
          });
        } else {

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
    };

    if (dto.toBeDeletedSubTaskIds) {
      for (const id of dto.toBeDeletedSubTaskIds) {
        const existingSubtask = existingTask.subTasks.find(
          (subtask) => subtask.id === id,
        );

        if (!existingSubtask) {
          throw new NotFoundException('Subtask not found!')
        }

        await this.dbService.subTask.delete({
          where: {
            id: existingSubtask.id
          }
        })
      }
    }

    const updatedTask = await this.dbService.task.update({
      where: {
        id: taskID,
        panelId: panelID,
        domainId: domainID,
      },
      data: {
        title: existingTask.title,
        description: existingTask.description,
        statusId: existingTask.statusId,
        order: existingTask.order,
        assignedTo: existingTask.assignedTo,
        assignedFrom: existingTask.assignedFrom,
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
      const authorOfTask = await this.dbService.task.findUnique({
        where: {
          id: taskID,
          authorId: userId,
        }
      })

      const ownerOfDomain = await this.dbService.domain.findUnique({
        where: {
          ownerId: userId,
          id: doaminID,
        }
      })

      const adminAccess = await this.dbService.domainMembership.findFirst({
        where: {
          memberRole: {
            in: [
              'admin',
              'owner'
            ]
          },
          domainId: doaminID,
        }
      })

      if (!authorOfTask || !ownerOfDomain || !adminAccess) {
        throw new MethodNotAllowedException('No access to this')
      };

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
      console.log(error)
      throw new InternalServerErrorException();
    }
  }

  async deleteALotOfTasksInASingleStatus(
    domainID: string,
    userId: string,
    panelID: string,
    statusID: string,
    tasksDto: DeleteMultipleTasksDto
  ) {
    const domainMembership = await this.dbService.domain.findUnique({
      where: {
        id: domainID,
        domainMembers: {
          some: {
            userId,
            memberRole: {
              in: [
                'owner', 'admin'
              ]
            }
          }
        }
      }
    })

    if (!domainMembership) {
      throw new UnauthorizedException('No access to this')
    };

    const existingStatus = await this.dbService.status.findUnique({
      where: {
        id: statusID
      }
    })

    if (!existingStatus) throw new NotFoundException('Status not found!');

    for (const taskID of tasksDto.taskIds) {
      const existingTask = await this.dbService.task.findUnique({
        where: { domainId: domainID, statusId: statusID, id: taskID, panelId: panelID },
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
          domainId: domainID,
          id: taskID,
          panelId: panelID,
          statusId: statusID,
        },
      });

      return new HttpException('Deleted', HttpStatus.ACCEPTED);

    }
  }

  async editMultipleTasks(
    domainID: string,
    userId: string,
    panelID: string,
    tasksDto: UpdateMultipleTasksDto[]
  ) {
    const updatedTasks = new Set()
    for (const task of tasksDto) {
      const { id, ...otherDetails } = task
      const updated = await this.editTask(domainID, panelID, id, userId, otherDetails)
      updatedTasks.add(updated)
    }

    return Array.from(updatedTasks);
  }

}



