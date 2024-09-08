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
    //const allTasks = []
    const allOngoingTasks = []
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
        panelMembers: {
          some: {
            domainId: particularDomain.id,
            userId: user.id
          }
        }
      }
    })

    const allPanelsIfIAmAnOwner = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
      }
    })


    const completedStatus = await this.dbService.status.findFirst({
      where: {
        name: 'completed'
      }
    })

    console.log({ panelsUserIsAssociatedInto, completedStatus })
    const panels = particularDomain.ownerId === user.id ? allPanelsIfIAmAnOwner : panelsUserIsAssociatedInto

    for (const panel of panels) {
      const assignedTasks = await this.dbService.task.findMany({
        where: {
          domainId,
          panelId: panel.id,
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
          },
          subTasks: true
        }
      })

      const ongoingTasks = await this.dbService.task.findMany({
        where: {
          domainId,
          panelId: panel.id,
          AND: [
            {
              assignedTo: {
                gt: today
              }
            },
            {
              statusId: {
                not: completedStatus.id
              }
            }
          ]
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
      });

      // Overdue Tasks
      const overdueTasks = await this.dbService.task.findMany({
        where: {
          domainId,
          panelId: panel.id,
          assignedTo: {
            lt: today,
          },
          statusId: {
            not: completedStatus.id
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
      });

      const filteredAssignedTasks = assignedTasks.filter((at) => at.assignedCollaborators.length > 0)

      for (const filteredAssigned of filteredAssignedTasks) {
        const completedTasks = await this.dbService.task.findMany({
          where: {
            domainId,
            panelId: filteredAssigned.id,
            statusId: completedStatus.id
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

        allCompletedTasks.push(...completedTasks)
      }

      allAssignedTasks.push(...filteredAssignedTasks)
      allOngoingTasks.push(...ongoingTasks)
      allOverdueTasks.push(...overdueTasks)
    }

    return {
      allAssignedTasks,
      allOngoingTasks,
      allOverdueTasks,
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
