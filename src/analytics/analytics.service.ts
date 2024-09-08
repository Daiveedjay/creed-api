import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { Task } from '@prisma/client';
import { Collaborator } from 'src/types';
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
        domainId: particularDomain.id,
        name: 'completed'
      }
    })

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
      const completedTasks = filteredAssignedTasks.filter((fa) => fa.statusId === completedStatus.id)

      allCompletedTasks.push(...completedTasks)
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

    const allPanelsIfIAmAnOwner = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
      }
    })

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

    const completedStatus = await this.dbService.status.findFirst({
      where: {
        domainId: particularDomain.id,
        name: 'completed'
      }
    })

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

      const filteredAssignedTasks = assignedTasks.filter((at) => at.assignedCollaborators.length > 0)
      const completedTasks = filteredAssignedTasks.filter((fa) => fa.statusId === completedStatus.id)

      allCompletedTasksArray.push(...completedTasks)
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

  async getTotalTimeToCompleteATask(domainId: string, email: string, range: string) {
    const allCompletedTasksArray: any[] = []
    const user = await this.userService.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    const particularDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainId,
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

    const allPanelsIfIAmAnOwner = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
      }
    })

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

    const completedStatus = await this.dbService.status.findFirst({
      where: {
        domainId: particularDomain.id,
        name: 'completed'
      }
    })

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
              createdAt: true,
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

      const filteredAssignedTasks = assignedTasks.filter((at) => at.assignedCollaborators.length > 0)
      const completedTasks = filteredAssignedTasks.filter((fa) => fa.statusId === completedStatus.id)

      allCompletedTasksArray.push(...completedTasks)
    }

    //
    // Calculate total time for each task
    const completedTasksWithTime = allCompletedTasksArray.map(task => {
      const userAssignedId = task.assignedCollaborators.map((collaborators: Collaborator) => {
        if (collaborators.user.id === user.id) {
          return collaborators.createdAt
        }

        return
      }) as Date[]
      console.log(userAssignedId[0])
      const createdDate = new Date(userAssignedId[0]);
      const modifiedDate = new Date(task.updatedAt);

      // Difference in milliseconds
      const timeDifference = modifiedDate.getTime() - createdDate.getTime();

      // Convert milliseconds to hours
      const totalTimeInHours = timeDifference / (1000 * 60 * 60);

      return {
        ...task,
        totalTimeInHours,
      };
    });

    // Filter tasks based on the desired date range
    const now = new Date();
    const filteredTasks = completedTasksWithTime.filter(task => {
      const completedDate = new Date(task.updatedAt);
      switch (range) {
        case 'last5Days':
          return completedDate >= new Date(now.setDate(now.getDate() - 5));
        case 'last2Weeks':
          return completedDate >= new Date(now.setDate(now.getDate() - 14));
        case 'last1Month':
          return completedDate >= new Date(now.setMonth(now.getMonth() - 1));
        case 'last6Weeks':
          return completedDate >= new Date(now.setMonth(now.getDate() - 42));
        case 'last3Months':
          return completedDate >= new Date(now.setMonth(now.getMonth() - 3));
        default:
          return false;
      }
    });

    // Group tasks by the day of the week
    const dayCounts: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    console.log({ filteredTasks })

    filteredTasks.forEach(task => {
      const userAssignedId = task.assignedCollaborators.map((collaborators: Collaborator) => {
        if (collaborators.user.id === user.id) {
          return collaborators.createdAt
        }

        return
      }) as Date[]
      const dayOfWeek = new Date(userAssignedId[0]).toLocaleString('en-US', { weekday: 'long' });
      dayCounts[dayOfWeek] += task.totalTimeInHours;
    });

    return dayCounts;

  }
}


