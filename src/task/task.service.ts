/* eslint-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { DbService } from 'src/utils/db.service';
import { CreateTaskDTO, DeleteMultipleTasksDto, UpdateMultipleTasksDto, UpdateTaskDto } from './task.dto';
import { Queue } from 'bull';
import { Format, getEmailSubject, getEmailTemplate } from 'src/utils/email-template';
import { TimeService } from 'src/utils/time.service';
import { TimeSeriesBucketTimestamp } from 'redis';

@Injectable()
export class TaskService {
  constructor(
    @InjectQueue('taskEmailQueue')
    private readonly emailQueue: Queue,
    private readonly dbService: DbService,
    private readonly timeService: TimeService
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

    const panel = await this.dbService.panel.findUnique({
      where: {
        id: panelID
      },
      include: {
        domain: {
          select: {
            name: true
          }
        }
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
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
              availableHoursFrom: true,
              availableHoursTo: true
            }
          }
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
      const usersEmails = users.map((user) => user.user.email)
      const subject = getEmailSubject(Format.ASSIGNED_TO_TASK, {
        panelName: panel.name
      })

      for (const user of users) {
        const firstName = user.user.fullName.split(' ')
        const body = getEmailTemplate(Format.ASSIGNED_TO_TASK, firstName[0], {
          domainName: panel.domain.name,
          panelName: panel.name,
          taskTitle: dto.title
        })

        const now = new Date()
        if (this.timeService.isWithinAvailableHours(now, {
          start: user.user.availableHoursFrom,
          end: user.user.availableHoursTo
        })) {
          await this.emailQueue.add('sendEmail', {
            email: usersEmails,
            subject: subject,
            body: body
          }, {
            delay: 300000,
          })
        } else {
          const nextAvailableTime = this.timeService.nextAvailableDate(now, {
            start: user.user.availableHoursFrom,
            end: user.user.availableHoursTo
          });
          const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

          await this.emailQueue.add(
            'sendEmail',
            { email: user.user.email, subject, body },
            { delay }
          );
        }
      }

      return tasksWithMentions;
    }

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
        assignedCollaborators: {
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
                availableHoursTo: true,
                availableHoursFrom: true
              }
            }
          }
        },
        domain: {
          select: {
            name: true,
          }
        },
        panel: {
          select: {
            name: true
          }
        }
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

    if (dto.usersToAssignIds?.length > 0) {
      const users = await this.dbService.domainMembership.findMany({
        where: {
          userId: {
            in: dto.usersToAssignIds
          },
          domainId: domainID,
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
              availableHoursTo: true,
              availableHoursFrom: true
            }
          }
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

      if (allreadyAssignedUsers.length > 0) throw new ConflictException('A user is already assigned to this task');

      const assignedUsers = await this.dbService.assignedCollaborators.createMany({
        data: users.map((col) => ({
          userId: col.userId,
          taskId: existingTask.id,
        }))
      })

      if (assignedUsers.count === 0) throw new ConflictException('Could not assign these users!')

      await this.dbService.notifications.createMany({
        data: users.map((user) => ({
          taskId: existingTask.id,
          userId: user.userId,
          hasRead: false
        }))
      });

      const subject = getEmailSubject(Format.ASSIGNED_TO_TASK, {
        panelName: existingTask.panel.name
      })

      for (const user of users) {
        const firstName = user.user.fullName.split(' ')
        const body = getEmailTemplate(Format.ASSIGNED_TO_TASK, firstName[0], {
          domainName: existingTask.domain.name,
          panelName: existingTask.panel.name,
          taskTitle: dto.title
        })

        const now = new Date()
        if (this.timeService.isWithinAvailableHours(now, {
          start: user.user.availableHoursFrom,
          end: user.user.availableHoursTo
        })) {
          await this.emailQueue.add('sendEmail', {
            email: user.user.email,
            subject: subject,
            body: body
          }, {
            delay: 300000,
          })
        } else {
          const nextAvailableTime = this.timeService.nextAvailableDate(now, {
            start: user.user.availableHoursFrom,
            end: user.user.availableHoursTo
          });
          const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

          await this.emailQueue.add(
            'sendEmail',
            { email: user.user.email, subject, body },
            { delay }
          );
        }
      }
    }

    if (dto.toBeDeletedSubTaskIds?.length > 0) {
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

    if (dto.usersToDeleteFromAssigned?.length > 0) {
      for (const id of dto.usersToDeleteFromAssigned) {
        const existingAssignedCollaborators = existingTask.assignedCollaborators.find(
          (assigned) => assigned.userId === id,
        );
        console.log(existingAssignedCollaborators)

        if (!existingAssignedCollaborators) {
          throw new NotFoundException('Subtask not found!')
        }

        await this.dbService.assignedCollaborators.delete({
          where: {
            id: existingAssignedCollaborators.id
          }
        })

        const subject = getEmailSubject(Format.REMOVED_FROM_TASK, {
          panelName: existingTask.panel.name
        })

        const firstName = existingAssignedCollaborators.user.fullName.split(' ')
        const body = getEmailTemplate(Format.REMOVED_FROM_TASK, firstName[0], {
          panelName: existingTask.panel.name,
          taskTitle: dto.title
        })

        const now = new Date()
        if (this.timeService.isWithinAvailableHours(now, {
          start: existingAssignedCollaborators.user.availableHoursFrom,
          end: existingAssignedCollaborators.user.availableHoursTo
        })) {
          await this.emailQueue.add('sendEmail', {
            email: existingAssignedCollaborators.user.email,
            subject: subject,
            body: body
          }, {
            delay: 300000,
          })
        } else {
          const nextAvailableTime = this.timeService.nextAvailableDate(now, {
            start: existingAssignedCollaborators.user.availableHoursFrom,
            end: existingAssignedCollaborators.user.availableHoursTo
          });
          const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

          await this.emailQueue.add(
            'sendEmail',
            { email: existingAssignedCollaborators.user.email, subject, body },
            { delay }
          );
        }
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
        domainId: doaminID,
        id: taskID,
        authorId: userId,
      }
    })

    const domain = await this.dbService.domain.findUnique({
      where: {
        id: doaminID,
      },
      select: {
        domainMembers: true
      }
    })

    const domainMembership = domain?.domainMembers.some((member) =>
      member.userId === userId && ['owner', 'admin'].includes(member.memberRole)
    );

    if (!authorOfTask && !domainMembership) {
      throw new MethodNotAllowedException('No access to this')
    };

    const existingTask = await this.dbService.task.findUnique({
      where: { domainId: doaminID, id: taskID, panelId: panelID },
      include: {
        assignedCollaborators: {
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
                availableHoursFrom: true,
                availableHoursTo: true
              }
            }
          }
        },
        subTasks: true,
        Notifications: true
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
        const usersEmail = collaborators.user.email
        await this.dbService.assignedCollaborators.delete({
          where: {
            id: collaborators.id
          }
        })

        const subject = 'This task has been deleted from the project!'
        const body = 'SIKE!!!!!!!!!!!'
        const now = new Date()
        if (this.timeService.isWithinAvailableHours(now, {
          start: collaborators.user.availableHoursFrom,
          end: collaborators.user.availableHoursTo
        })) {
          await this.emailQueue.add('sendEmail', {
            email: collaborators.user.email,
            subject: subject,
            body: body
          }, {
            delay: 300000,
          })
        } else {
          const nextAvailableTime = this.timeService.nextAvailableDate(now, {
            start: collaborators.user.availableHoursFrom,
            end: collaborators.user.availableHoursTo
          });
          const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

          await this.emailQueue.add(
            'sendEmail',
            { email: collaborators.user.email, subject, body },
            { delay }
          );
        }


        //const subject = getEmailSubject(Format.REMOVED_FROM_TASK, {
        //panelName: existingTask.panel.name
        //})

        //const firstName = existingAssignedCollaborators.user.fullName.split(' ')
        //const body = getEmailTemplate(Format.REMOVED_FROM_TASK, firstName[0], {
        //panelName: existingTask.panel.name,
        //taskTitle: dto.title
        //})
        //console.log(usersEmail)

        //await this.emailQueue.add('sendEmail', {
        //email: usersEmail,
        //subject: subject,
        //body: body
        //}, {
        //delay: 300000,
        //})
      }
    }

    if (existingTask.Notifications) {
      for (const notification of existingTask.Notifications) {
        await this.dbService.notifications.delete({
          where: {
            id: notification.id
          }
        })
      }
    }

    await this.dbService.task.delete({
      where: {
        domainId: doaminID,
        id: taskID,
        panelId: panelID,
      },
    });

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
          assignedCollaborators: {
            include: {
              user: {
                select: {
                  email: true,
                  fullName: true,
                  availableHoursFrom: true,
                  availableHoursTo: true
                }
              }
            }
          },
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
          const usersEmail = collaborators.user.email
          await this.dbService.assignedCollaborators.delete({
            where: {
              id: collaborators.id
            }
          })

          const subject = 'This task has been deleted from the project!'
          const body = 'SIKE!!!!!!!!!!!'
          const now = new Date()
          if (this.timeService.isWithinAvailableHours(now, {
            start: collaborators.user.availableHoursFrom,
            end: collaborators.user.availableHoursTo
          })) {
            await this.emailQueue.add('sendEmail', {
              email: collaborators.user.email,
              subject: subject,
              body: body
            }, {
              delay: 300000,
            })
          } else {
            const nextAvailableTime = this.timeService.nextAvailableDate(now, {
              start: collaborators.user.availableHoursFrom,
              end: collaborators.user.availableHoursTo
            });
            const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

            await this.emailQueue.add(
              'sendEmail',
              { email: collaborators.user.email, subject, body },
              { delay }
            );
          }
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
    for (const dto of tasksDto) {
      const { id } = dto

      const existingTask = await this.dbService.task.findUnique({
        where: {
          id,
          panelId: panelID,
          domainId: domainID,
        },
        include: {
          subTasks: true,
          assignedCollaborators: {
            include: {
              user: {
                select: {
                  email: true,
                  fullName: true,
                  availableHoursFrom: true,
                  availableHoursTo: true
                }
              },
            }
          },
          panel: {
            select: {
              name: true,
            }
          },
          domain: {
            select: {
              name: true
            }
          }
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

      if (dto.usersToAssignIds?.length > 0) {
        const users = await this.dbService.domainMembership.findMany({
          where: {
            userId: {
              in: dto.usersToAssignIds
            },
            domainId: domainID,
          },
          select: {
            user: {
              select: {
                email: true,
                fullName: true,
                availableHoursTo: true,
                availableHoursFrom: true
              }
            },
            userId: true
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
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        })

        if (allreadyAssignedUsers.length > 0) throw new ConflictException('A user is already assigned to this task');

        const assignedUsers = await this.dbService.assignedCollaborators.createMany({
          data: users.map((col) => ({
            userId: col.userId,
            taskId: existingTask.id,
          }))
        })
        const usersEmails = allreadyAssignedUsers.map((user) => user.user.email)


        if (assignedUsers.count === 0) throw new ConflictException('Could not assign these users!')

        await this.dbService.notifications.createMany({
          data: users.map((user) => ({
            taskId: existingTask.id,
            userId: user.userId,
            hasRead: false
          }))
        })

        const subject = getEmailSubject(Format.ASSIGNED_TO_TASK, {
          panelName: existingTask.panel.name
        })

        for (const user of users) {
          const firstName = user.user.fullName.split(' ')
          const body = getEmailTemplate(Format.ASSIGNED_TO_TASK, firstName[0], {
            domainName: existingTask.domain.name,
            panelName: existingTask.panel.name,
            taskTitle: dto.title
          })

          const now = new Date()
          if (this.timeService.isWithinAvailableHours(now, {
            start: user.user.availableHoursFrom,
            end: user.user.availableHoursTo
          })) {
            await this.emailQueue.add('sendEmail', {
              email: user.user.email,
              subject: subject,
              body: body
            }, {
              delay: 300000,
            })
          } else {
            const nextAvailableTime = this.timeService.nextAvailableDate(now, {
              start: user.user.availableHoursFrom,
              end: user.user.availableHoursTo
            });
            const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

            await this.emailQueue.add(
              'sendEmail',
              { email: user.user.email, subject, body },
              { delay }
            );
          }

        }

        if (dto.toBeDeletedSubTaskIds?.length > 0) {
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

        if (dto.usersToDeleteFromAssigned?.length > 0) {
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

            const subject = getEmailSubject(Format.REMOVED_FROM_TASK, {
              panelName: existingTask.panel.name
            })

            const firstName = existingAssignedCollaborators.user.fullName.split(' ')
            const body = getEmailTemplate(Format.REMOVED_FROM_TASK, firstName[0], {
              panelName: existingTask.panel.name,
              taskTitle: dto.title
            })

            const now = new Date()
            if (this.timeService.isWithinAvailableHours(now, {
              start: existingAssignedCollaborators.user.availableHoursFrom,
              end: existingAssignedCollaborators.user.availableHoursTo
            })) {
              await this.emailQueue.add('sendEmail', {
                email: existingAssignedCollaborators.user.email,
                subject: subject,
                body: body
              }, {
                delay: 300000,
              })
            } else {
              const nextAvailableTime = this.timeService.nextAvailableDate(now, {
                start: existingAssignedCollaborators.user.availableHoursFrom,
                end: existingAssignedCollaborators.user.availableHoursTo
              });
              const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

              await this.emailQueue.add(
                'sendEmail',
                { email: existingAssignedCollaborators.user.email, subject, body },
                { delay }
              );
            }

          }
        }


        const updatedTask = await this.dbService.task.update({
          where: {
            id,
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


        updatedTasks.add(updatedTask)
      }

      return Array.from(updatedTasks);
    }

  }


}
