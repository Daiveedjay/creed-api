import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAnnouncementDto } from './announcements.dto';
import { DbService } from 'src/utils/db.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly dbService: DbService,
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

      console.log(users)

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
          userId: user.userId
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

  remove(id: number) {
    return `This action removes a #${id} announcement`;
  }
}
