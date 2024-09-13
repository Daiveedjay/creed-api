/* eslint-disable prettier/prettier */
import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { Collaborator } from 'src/types';
import { UserService } from 'src/user/user.service';
import { DbService } from 'src/utils/db.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dbService: DbService,
    private readonly userService: UserService,
  ) { }
  async getAnalyticsofDomain(domainId: string, email: string) {
    const allAssignedTasks = [];
    const user = await this.userService.getProfileThroughEmail(email);
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
        panelMembers: true,
      },
    });

    if (!particularDomain)
      throw new MethodNotAllowedException('No domain like this is found!');

    const panelsUserIsAssociatedInto = await this.dbService.panel.findMany({
      where: {
        panelMembers: {
          some: {
            domainId: particularDomain.id,
            userId: user.id,
          },
        },
      },
    });

    const allPanelsIfIAmAnOwner = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
      },
    });

    const panels =
      particularDomain.ownerId === user.id
        ? allPanelsIfIAmAnOwner
        : panelsUserIsAssociatedInto;

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
                  profilePicture: true,
                },
              },
            },
          },
          subTasks: true,
        },
      });
      const filteredAssignedTasks = assignedTasks.filter(
        (at) => at.assignedCollaborators.length > 0,
      );

      allAssignedTasks.push(...filteredAssignedTasks);
    }

    return {
      allAssignedTasks,
      numberOfDomainMembers: particularDomain.domainMembers.length,
      domainId,
    };
  }

  async getAverageTiemToCompleteATask(
    domainId: string,
    email: string,
    range: string,
  ) {
    const allCompletedTasksArray: any[] = [];
    const user = await this.userService.getProfileThroughEmail(email);
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
        panelMembers: true,
      },
    });

    if (!particularDomain)
      throw new MethodNotAllowedException('No domain like this is found!');

    const allPanelsIfIAmAnOwner = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
      },
    });

    const panelsUserIsAssociatedInto = await this.dbService.panel.findMany({
      where: {
        panelMembers: {
          some: {
            domainId: particularDomain.id,
            userId: user.id,
          },
        },
      },
    });

    const completedStatus = await this.dbService.status.findFirst({
      where: {
        domainId: particularDomain.id,
        name: 'completed',
      },
    });

    const panels =
      particularDomain.ownerId === user.id
        ? allPanelsIfIAmAnOwner
        : panelsUserIsAssociatedInto;

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
                  profilePicture: true,
                },
              },
            },
          },
          subTasks: true,
        },
      });

      const filteredAssignedTasks = assignedTasks.filter(
        (at) => at.assignedCollaborators.length > 0,
      );
      const completedTasks = filteredAssignedTasks.filter(
        (fa) => fa.statusId === completedStatus.id,
      );

      allCompletedTasksArray.push(...completedTasks);
    }

    //
    // Calculate total time for each task
    const completedTasksWithTime = allCompletedTasksArray.map((task) => {
      const assignedCollaborator = task.assignedCollaborators.find((collaborator: Collaborator) => collaborator.user.id === user.id)

      if (!assignedCollaborator) {
        return {
          task: [],
          totalTimeInHours: 0
        }
      } else {
        const createdDate = new Date(assignedCollaborator.createdAt);
        const modifiedDate = new Date(task.updatedAt);

        // Difference in milliseconds
        const timeDifference = modifiedDate.getTime() - createdDate.getTime();

        // Convert milliseconds to hours
        const totalTimeInHours = timeDifference / (1000 * 60 * 60);

        return {
          ...task,
          totalTimeInHours,
        };
      }
    });

    if (completedTasksWithTime.length > 0) {
      // Filter tasks based on the desired date range
      const now = new Date();
      const filteredTasks = completedTasksWithTime.filter((task) => {
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
      const dayCounts = {
        Monday: { totalTime: 0, taskCount: 0 },
        Tuesday: { totalTime: 0, taskCount: 0 },
        Wednesday: { totalTime: 0, taskCount: 0 },
        Thursday: { totalTime: 0, taskCount: 0 },
        Friday: { totalTime: 0, taskCount: 0 },
        Saturday: { totalTime: 0, taskCount: 0 },
        Sunday: { totalTime: 0, taskCount: 0 },
      };

      filteredTasks.forEach((task) => {
        const assignedCollaborator = task.assignedCollaborators.find((collaborator: Collaborator) => collaborator.user.id === user.id)
        // Get the day of the week from the assigned date
        const dayOfWeek = new Date(assignedCollaborator.createdAt).toLocaleString('en-US', {
          weekday: 'long',
        });

        // Update the dayCounts object with the total time and task count
        dayCounts[dayOfWeek].totalTime += task.totalTimeInHours;
        dayCounts[dayOfWeek].taskCount++;
      });

      // Calculate the average time for each day
      const dayAverages: Record<string, number> = {};
      for (const day in dayCounts) {
        const { totalTime, taskCount } = dayCounts[day];
        dayAverages[day] = taskCount > 0 ? totalTime / taskCount : 0;
      }

      return dayAverages;
    } else {
      return {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
      }
    }
  }

  async getTotalTimeToCompleteATask(
    domainId: string,
    email: string,
    range: string,
  ) {
    const allCompletedTasksArray: any[] = [];
    const user = await this.userService.getProfileThroughEmail(email);
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
        panelMembers: true,
      },
    });

    if (!particularDomain)
      throw new MethodNotAllowedException('No domain like this is found!');

    const allPanelsIfIAmAnOwner = await this.dbService.panel.findMany({
      where: {
        domainId: particularDomain.id,
      },
    });

    const panelsUserIsAssociatedInto = await this.dbService.panel.findMany({
      where: {
        panelMembers: {
          some: {
            domainId: particularDomain.id,
            userId: user.id,
          },
        },
      },
    });

    const completedStatus = await this.dbService.status.findFirst({
      where: {
        domainId: particularDomain.id,
        name: 'completed',
      },
    });

    const panels =
      particularDomain.ownerId === user.id
        ? allPanelsIfIAmAnOwner
        : panelsUserIsAssociatedInto;

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
                  profilePicture: true,
                },
              },
            },
          },
          subTasks: true,
        },
      });

      const filteredAssignedTasks = assignedTasks.filter(
        (at) => at.assignedCollaborators.length > 0,
      );
      const completedTasks = filteredAssignedTasks.filter(
        (fa) => fa.statusId === completedStatus.id,
      );

      allCompletedTasksArray.push(...completedTasks);
    }

    //
    // Calculate total time for each task
    const completedTasksWithTime = allCompletedTasksArray.map((task) => {
      const assignedCollaborator = task.assignedCollaborators.find((collaborator: Collaborator) => collaborator.user.id === user.id)

      if (!assignedCollaborator) {
        return {
          task: [],
          totalTimeInHours: 0
        }
      }
      const createdDate = new Date(assignedCollaborator.createdAt);
      const modifiedDate = new Date(task.updatedAt);

      if (!assignedCollaborator) {
        return {
          task: [],
          totalTimeInHours: 0
        }
      }

      // Difference in milliseconds
      const timeDifference = modifiedDate.getTime() - createdDate.getTime();

      // Convert milliseconds to hours
      const totalTimeInHours = timeDifference / (1000 * 60 * 60);

      return {
        ...task,
        totalTimeInHours,
      };
    });

    if (completedTasksWithTime.length > 0) {
      // Filter tasks based on the desired date range
      const now = new Date();
      const filteredTasks = completedTasksWithTime.filter((task) => {
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

      filteredTasks.forEach((task) => {
        const assignedCollaborator = task.assignedCollaborators.find((collaborator: Collaborator) => collaborator.user.id === user.id)

        const dayOfWeek = new Date(assignedCollaborator.createdAt).toLocaleString('en-US', {
          weekday: 'long',
        });
        dayCounts[dayOfWeek] += task.totalTimeInHours;
      });

      return dayCounts;

    } else {
      return {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
      }
    }
  }
}
