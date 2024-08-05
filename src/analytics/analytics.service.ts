import { Injectable, MethodNotAllowedException } from '@nestjs/common';
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
    const allOngoingTask = []
    const allTasksNumber = []
    const allOverduedTask = []
    const allCompletedTask = []
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
      })
      const allTasks = await this.dbService.task.findMany({
        where: {
          domainId,
          panelId: panel.id,
        },
        include: {
          subTasks: true,
          assignedCollaborators: true,
        }
      })

      const allCompletedTasks = await this.dbService.task.findMany({
        where: {
          domainId,
          panelId: panel.id,
          statusId: completedStatus.id
        }
      })

      const ongoingTasks = await this.dbService.task.findMany({
        where: {
          domainId,
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
          domainId,
          panelId: panel.id,
          assignedTo: {
            lt: today,
          },
        },
      });

      allAssignedTasks.push(...assignedTasks)
      allOngoingTask.push(...ongoingTasks)
      allTasksNumber.push(...allTasks)
      allOverduedTask.push(...overdueTasks)
      allCompletedTask.push(...allCompletedTasks)
    }

    return {
      allAssignedTasks,
      allOngoingTask,
      allOverduedTask,
      allTasksNumber,
      allCompletedTask
    }
  }
}
