import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { Task } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { DbService } from 'src/utils/db.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dbService: DbService,
    private readonly userService: UserService
  ) { }
  async getAnalyticsofDomain(domainId: string, email: string) {
    const allAssignedTasks = []
    const allOngoingTasks = []
    const allTasks = []
    const allOverdueTasks = []
    const allCompletedTasks = []
    const today = new Date()
    const user = await this.userService.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    const particularDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainId,
        OR: [
          { ownerId: user.id },
          {
            domainMembers: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        panels: true,
        tasks: true,
        announcements: true,
        domainMembers: true,
        panelMembers: true
      }
    })

    if (!particularDomain) throw new MethodNotAllowedException('No domain like this is found!')

    const panelsUserIsAssociatedInto = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
        OR: [
          {
            ownerId: user.id
          },
          {
            panelMembers: {
              some: {
                userId: user.id
              }
            }
          },
        ]
      }
    })

    for (const panel of panelsUserIsAssociatedInto) {
      const completedStatus = await this.dbService.status.findFirst({
        where: {
          name: 'completed'
        }
      })
      const assignedTasks = await this.dbService.task.findMany({
        where: {
          domainId,
          panelId: panel.id,
          assignedCollaborators: {
            some: {
              userId: {
                not: user.id
              }
            }
          }
        },
        include: {
          assignedCollaborators: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true
                }
              }
            }
          }
        }
      })
      const allTasks = await this.dbService.task.findMany({
        where: {
          panelId: panel.id,
        },
        include: {
          subTasks: true,
          assignedCollaborators: true,
        }
      })

      const allCompletedTasks = await this.dbService.task.findMany({
        where: {
          panelId: panel.id,
          statusId: completedStatus.id
        }
      })

      const ongoingTasks = await this.dbService.task.findMany({
        where: {
          panelId: panel.id,
          AND: [
            {
              assignedFrom: {
                lte: today,
              },
            },
            {
              assignedTo: {
                gt: today
              }
            }
          ]
        },
      });

      // Overdue Tasks
      const overdueTasks = await this.dbService.task.findMany({
        where: {
          panelId: panel.id,
          assignedTo: {
            lt: today,
          },
        },
      });

      allAssignedTasks.push(...assignedTasks)
      allOngoingTasks.push(...ongoingTasks)
      allTasks.push(...allTasks)
      allOverdueTasks.push(...overdueTasks)
      allCompletedTasks.push(...allCompletedTasks)
    }

    return {
      allAssignedTasks,
      allOngoingTasks,
      allOverdueTasks,
      allTasks,
      allCompletedTasks,
      numberOfDomainMembers: particularDomain.domainMembers.length,
      domainId
    }
  }

  async getAverageTiemToCompleteATask(domainId: string, email: string) {
    const allCompletedTasksArray: Task[] = []
    const user = await this.userService.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    const particularDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainId,
        OR: [
          { ownerId: user.id },
          {
            domainMembers: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        panels: true,
        tasks: true,
        announcements: true,
        domainMembers: true,
        panelMembers: true
      }
    })

    if (!particularDomain) throw new MethodNotAllowedException('No domain like this is found!')

    const panelsUserIsAssociatedInto = await this.dbService.panel.findMany({
      where: {
        OR: [
          {
            ownerId: user.id
          },
          {
            panelMembers: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      }
    })

    for (const panel of panelsUserIsAssociatedInto) {
      const completedStatus = await this.dbService.status.findFirst({
        where: {
          name: 'completed'
        }
      })

      const allCompletedTasks = await this.dbService.task.findMany({
        where: {
          panelId: panel.id,
          statusId: completedStatus.id
        }
      })

      allCompletedTasksArray.push(...allCompletedTasks)
    }

    // Calculate the total duration of all completed tasks
    const totalDuration = allCompletedTasksArray.reduce((acc, task) => {
      const duration = task.updatedAt.getTime() - task.createdAt.getTime(); // Duration in milliseconds
      return acc + duration;
    }, 0);
    const averageDuration = totalDuration / allCompletedTasksArray.length;
    const averageDurationInHours = averageDuration / (1000 * 60 * 60);

    return averageDurationInHours;

  }
}
