/* eslint-disable prettier/prettier */
import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateDomainDTO } from './domain.dto';
import { Roles } from '@prisma/client';
import CONSTANTS from 'src/lib/constants';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class DomainService {
  constructor(
    private readonly dbService: DbService,
    private readonly notificationGateway: NotificationGateway
  ) { }

  async getUserDomains(userID: string) {
    return await this.dbService.domain.findMany({
      where: {
        OR: [
          { ownerId: userID },
          { domainMembers: { some: { userId: userID } } },
        ],
      },
      include: {
        announcements: true,
        domainMembers: true
      }
    });

  }

  async getUserDomain(userID: string, doaminID: string) {
    const domain = await this.dbService.domain.findUnique({
      where: {
        id: doaminID,
        OR: [
          { ownerId: userID },
          { domainMembers: { some: { userId: userID } } },
        ],
      },
      include: {
        domainMembers: true,
        announcements: true,
      }
    });

    if (!domain) throw new NotFoundException('No domain like this exists!');

    return domain

  }

  async getUserDomainButLimitedAccess(domainID: string, userId: string) {
    const domain = await this.dbService.domain.findUnique({
      where: {
        id: domainID,
        domainMembers: {
          some: {
            userId: userId,
          }
        }
      },
      include: {
        domainMembers: {
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
                id: true
              }
            }
          }
        }
      }
    });

    if (!domain) throw new NotFoundException('No domain like this exists!');

    return domain
  }

  async update(userID: string, dto: CreateDomainDTO, domainID: string) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        id: userID
      }
    })

    if (!currentUser) throw new NotFoundException('User not found')

    const avaliableDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainID,
        ownerId: currentUser.id
      }
    })

    if (!avaliableDomain) throw new NotFoundException('Domain not found')

    await this.dbService.domain.update({
      where: { id: domainID, ownerId: currentUser.id },
      data: {
        ...dto,
      },
    });

    await this.notificationGateway.globalWebSocketFunction({
      domain: domainID,
      message: `Some information has been changed in the domain`
    }, 'domain-announcement')

    throw new HttpException('Updated', HttpStatus.ACCEPTED)
  }

  async create(userID: string, dto: CreateDomainDTO) {
    const domainLength = await this.dbService.domain.count({
      where: {
        ownerId: userID
      }
    })

    if (domainLength >= CONSTANTS.MAXIMUM_DOMAINS) {
      throw new ConflictException('Maximum domains exceeded');
    };

    const domain = await this.dbService.domain.create({
      data: {
        ...dto,
        domainMembers: {
          create: {
            memberRole: 'owner',
            userId: userID
          }
        },
        ownerId: userID
      },
    });

    return domain

  }

  async leaveADomain(domainId: string, userId: string) {
    const domainMembership = await this.dbService.domainMembership.findFirst({
      where: {
        domainId,
        userId
      }
    })

    if (!domainMembership) {
      throw new MethodNotAllowedException('Domain not found!')
    };

    await this.dbService.domainMembership.delete({
      where: {
        id: domainMembership.id
      }
    })

    return new HttpException('Left apparently', HttpStatus.OK)
  }

  async deleteDomain(domainID: string, userId: string) {
    const allDomains = await this.getUserDomains(userId)
    const domainToBeDeleted = await this.dbService.domain.findUnique({
      where: {
        id: domainID
      },
      include: {
        panels: true,
        status: true,
        tasks: true,
        announcements: true
      }
    });

    if (!domainToBeDeleted) {
      throw new NotFoundException();
    } else if (allDomains.length <= 1) {
      throw new ConflictException('You need at least one domain to be available');
    }

    for (const task of domainToBeDeleted.tasks) {
      await this.dbService.task.delete({
        where: {
          id: task.id
        }
      })
    }

    for (const status of domainToBeDeleted.status) {
      await this.dbService.status.delete({
        where: {
          id: status.id
        }
      })
    }

    for (const panel of domainToBeDeleted.panels) {
      await this.dbService.panel.delete({
        where: {
          id: panel.id
        }
      })
    }

    for (const announcement of domainToBeDeleted.announcements) {
      await this.dbService.announcement.delete({
        where: {
          id: announcement.id
        }
      })
    }

    await this.dbService.domain.delete({
      where: {
        id: domainID
      },
      include: {
        panels: true,
        status: true,
        tasks: true,
        announcements: true
      }
    });

    throw new HttpException('Deleted', HttpStatus.ACCEPTED)
  }
}
