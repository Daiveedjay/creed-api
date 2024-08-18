/* eslint-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO, DeleteMultipleTasksDto, UpdateMultipleTasksDto, UpdateTaskDto } from './task.dto';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { NotifyService } from 'src/utils/notify.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly dbService: DbService,
    private readonly notifyService: NotifyService,
  ) { }

  async getTasks(domainID: string, panelID: string) {
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

  }

  async getTask(domainID: string, panelID: string, taskID: string) {
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
  }

  async createTask(
    domainID: string,
    panelID: string,
    userId: string,
    dto: CreateTaskDTO,
  ) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser) throw new NotFoundException('No user found!');

    const panelMembers = await this.dbService.panelMembership.findMany({
      where: {
        domainId: domainID,
        panelId: panelID
      },
      select: {
        userId: true
      }
    })

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

      await this.dbService.notifications.createMany({
        data: users.map((user) => ({
          taskId: tasks.id,
          userId: user.userId,
          hasRead: false
        }))
      })

      const tasksWithMentions = await this.getTask(domainID, panelID, tasks.id)

      await this.notifyService.notifyUser(dto.usersToAssignIds, { body: 'Changes', title: 'You have been assigned' })
      await this.notifyService.notifyUser(panelMembers.map((pm) => pm.userId), { body: 'Changes', title: 'You might wanna refresh' })

      return tasksWithMentions;
    }

    await this.notifyService.notifyUser(panelMembers.map((pm) => pm.userId), { body: 'Changes', title: 'You might wanna refresh' })
    return tasks;
  }

  async editTask(
    domainID: string,
    panelID: string,
    taskID: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    const existingTask = await this.dbService.task.findUnique({
      where: {
        id: taskID,
        panelId: panelID,
        domainId: domainID,
      },
      include: {
        subTasks: true,
        assignedCollaborators: true,
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

      const allreadyAssignedUsers = await this.dbService.assignedCollaborators.findMany({
        where: {
          userId: {
            in: dto.usersToAssignIds
          },
          taskId: existingTask.id,
        },
      })

      if (allreadyAssignedUsers.length !== 0) throw new ConflictException('A user is already assigned to this task');

      const assignedUsers = await this.dbService.assignedCollaborators.createMany({
        data: users.map((col) => ({
          userId: col.userId,
          taskId: existingTask.id,
        }))
      })

      await this.notifyService.notifyUser(dto.usersToAssignIds, { body: 'Changes', title: 'You might wanna refresh' })

      if (assignedUsers.count === 0) throw new ConflictException('Could not assign these users!')

      await this.dbService.notifications.createMany({
        data: users.map((user) => ({
          taskId: existingTask.id,
          userId: user.userId,
          hasRead: false
        }))
      })

    }

    if (dto.toBeDeletedSubTaskIds?.length !== 0) {
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

    if (dto.usersToDeleteFromAssigned?.length !== 0) {
      for (const id of dto.usersToDeleteFromAssigned) {
        const existingAssignedCollaborators = existingTask.assignedCollaborators.find(
          (assigned) => assigned.userId === id,
        );

        if (!existingAssignedCollaborators) {
          throw new NotFoundException('Subtask not found!')
        }

        await this.dbService.assignedCollaborators.delete({
          where: {
            id: existingAssignedCollaborators.id
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

    await this.notifyService.notifyUser(dto.usersToAssignIds, { body: 'Changes', title: 'You might wanna refresh' })

    return updatedTask;

  }

  async deleteTask(
    doaminID: string,
    taskID: string,
    panelID: string,
    userId: string,
  ) {
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

    //await this.notifyService.notifyUser(dto.usersToAssignIds, { body: 'Changes', title: 'You might wanna refresh' })

    return new HttpException('Deleted', HttpStatus.ACCEPTED);
  }

  async deleteALotOfTasksInASingleStatus(
    domainID: string,
    userId: string,
    panelID: string,
    statusID: string,
    tasksDto: DeleteMultipleTasksDto
  ) {
    const domain = await this.dbService.domain.findUnique({
      where: {
        id: domainID,
      },
      select: {
        domainMembers: true
      }
    })

    const domainMembership = domain?.domainMembers.some((member) =>
      member.userId === userId && ['owner', 'admin'].includes(member.memberRole)
    );

    if (!domainMembership) {
      throw new MethodNotAllowedException('No access to this')
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
    }

    return new HttpException('Deleted', HttpStatus.ACCEPTED);
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



