import { ConflictException, HttpException, HttpStatus, Injectable, MethodNotAllowedException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAnnouncementDto } from './announcements.dto';
import { DbService } from 'src/utils/db.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly dbService: DbService,
    private readonly userService: UserService,
  ) { }
  async create(email: string, domainId: string, createAnnouncementDto: CreateAnnouncementDto) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        email,
      }
    })

    if (!currentUser) throw new UnauthorizedException('No user present');

    const domain = await this.dbService.domain.findUnique({
      where: {
        id: domainId,
        OR: [
          { ownerId: currentUser.id },
          {
            domainMembers: {
              some: {
                userId: currentUser.id,
                memberRole: {
                  in: ['admin']
                }
              }
            }
          }
        ]
      }
    })

    if (!domain) throw new UnauthorizedException('You are not allowed access!');
    const announcements = await this.dbService.announcement.create({
      data: {
        content: createAnnouncementDto.content,
        authorId: currentUser.id,
        domainId,
        isAutomated: createAnnouncementDto.isAutomated
      },
      select: {
        id: true,
        author: {
          select: {
            id: true,
            profilePicture: true,
            fullName: true
          }
        },
        isAutomated: true,
        sentAt: true,
        content: true,
        mentions: true
      }
    })

    if (!announcements) throw new ConflictException('Error creating the announcements')

    if (createAnnouncementDto.mentions.length !== 0) {
      const users = await this.dbService.domainMembership.findMany({
        where: {
          userId: {
            in: createAnnouncementDto.mentions
          },
          domainId: domainId,
        }
      })


      if (users.length === 0) throw new NotFoundException('Users are not in this domain!');

      const newMentions = await this.dbService.mentions.createMany({
        data: users.map((user) => ({
          userId: user.userId,
          announcementId: announcements.id
        }))
      })

      if (newMentions.count === 0) throw new ConflictException('Could not add the mentions!')

      await this.dbService.notifications.createMany({
        data: users.map((user) => ({
          announcementId: announcements.id,
          userId: user.userId,
          hasRead: false
        }))
      })

      const announcementsWithMentions = await this.findOne(domainId, announcements.id)

      return announcementsWithMentions;
    }

    return announcements;
  }

  async findAll(domainId: string) {
    return await this.dbService.announcement.findMany({
      where: {
        domainId
      },
      select: {
        id: true,
        author: {
          select: {
            id: true,
            profilePicture: true,
            fullName: true
          }
        },
        sentAt: true,
        isAutomated: true,
        content: true,
        mentions: true
      }
    })
  }

  async findOne(domainId: string, announcementId: string) {
    const particularAnnouncement = await this.dbService.announcement.findUnique({
      where: {
        id: announcementId,
        domainId,
      },
      select: {
        id: true,
        author: {
          select: {
            id: true,
            profilePicture: true,
            fullName: true
          }
        },
        sentAt: true,
        isAutomated: true,
        content: true,
        mentions: {
          select: {
            user: {
              select: {
                fullName: true,
                id: true,
                profilePicture: true
              }
            }
          }
        }
      }
    })

    if (!particularAnnouncement) throw new NotFoundException('No announcement like this');

    return particularAnnouncement;
  }

  async deleteAnnouncements(domainId: string, announcementId: string, email: string) {
    const currentUser = await this.userService.getProfileThroughEmail(email)
    const ableToAccess = await this.dbService.domain.findUnique({
      where: {
        id: domainId,
        domainMembers: {
          some: {
            userId: currentUser.id,
            memberRole: {
              in: [
                'owner', 'admin'
              ]
            }
          }
        }
      }
    })

    if (!ableToAccess) throw new MethodNotAllowedException('No access')

    const particularAnnouncement = await this.findOne(domainId, announcementId)

    await this.dbService.announcement.delete({
      where: {
        id: particularAnnouncement.id
      }
    })

    return new HttpException('Deleted', HttpStatus.OK)
  }
}
