import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { DbService } from 'src/utils/db.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly dbService: DbService,
    private readonly userServive: UserService
  ) { }
  async getAllAnnouncementsNotifications(email: string) {
    const user = await this.userServive.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    return await this.dbService.notifications.findMany({
      where: {
        userId: user.id
      },
      select: {
        announcements: {
          select: {
            id: true,
            content: true,
            domainId: true,
            mentions: true,
            sentAt: true,
            author: {
              select: {
                fullName: true,
                profilePicture: true,
                id: true
              }
            },
          }
        },
        id: true
      }
    })
  }

  async getALlAssignedTasksNotifications(email: string) {
    const user = await this.userServive.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    return await this.dbService.notifications.findMany({
      where: {
        userId: user.id
      },
      select: {
        tasks: {
          select: {
            id: true,
            title: true,
            assignedTo: true,
            assignedFrom: true,
            author: {
              select: {
                fullName: true
              }
            },
            assignedCollaborators: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  }
                }
              }
            }
          }
        },
        id: true
      }
    })

  }
}
