import { ConflictException, Injectable, MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { DbService } from 'src/utils/db.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly dbService: DbService,
    private readonly userServive: UserService
  ) { }
  async getAllAnnouncementsNotifications(email: string, domainID: string) {
    const user = await this.userServive.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    return await this.dbService.notifications.findMany({
      where: {
        userId: user.id,
        announcements: {
          domainId: domainID
        }
      },
      select: {
        announcements: {
          select: {
            id: true,
            content: true,
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

  async getALlAssignedTasksNotifications(email: string, domainID: string) {
    const user = await this.userServive.getProfileThroughEmail(email)
    if (!user) throw new MethodNotAllowedException('User not found!');

    return await this.dbService.notifications.findMany({
      where: {
        userId: user.id,
        tasks: {
          domainId: domainID
        }
      },
      select: {
        tasks: {
          select: {
            id: true,
            title: true,
            assignedTo: true,
            assignedFrom: true,
            panelId: true,
            author: {
              select: {
                id: true,
                fullName: true
              }
            },
            assignedCollaborators: {
              select: {
                user: {
                  select: {
                    id: true,
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

  async announceMentIsRead(notificationId: string) {
    const notification = await this.dbService.notifications.findUnique({
      where: {
        id: notificationId,
        hasRead: false
      }
    })

    if (!notification) throw new ConflictException('This notification has been either read or not found!')

    await this.dbService.notifications.update({
      where: {
        id: notification.id
      },
      data: {
        hasRead: true
      }
    })
  }
}
