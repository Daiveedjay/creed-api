/* eslint-disable prettier/prettier */
import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, Inject } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateDomainDTO } from './domain.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class DomainService {
  constructor(
    @Inject(DbService)
    private readonly dbService: DbService
  ) {}

  async getUserDomains(userID: string) {
    try {
      return await this.dbService.domain.findMany({
        where: {
          OR: [
            { ownerId: userID },
            { domainMembers: { some: { userId: userID } } },
          ],
        },
        // include: {
        //   panels: true,
        //   status: true,
        // }
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserDomain(userID: string, doaminID: string) {
    try {
      const domain = await this.dbService.domain.findUnique({
        where: {
          id: doaminID,
          OR: [
            { ownerId: userID },
            { domainMembers: { some: { userId: userID } } },
          ],
        },
        // include: {
        //   panels: true,
        //   status: true
        // }
      });

      if(!domain) throw new NotFoundException('No domain like this exists!');

      return domain
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(userID: string, dto: CreateDomainDTO, domainID: string) {
    try {
      const currentUser = await this.dbService.user.findUnique({
        where: {
          id: userID
        }
      })

      if(!currentUser) throw new NotFoundException('User not found')

      const avaliableDomain = await this.dbService.domain.findUnique({
        where: {
          id: domainID,
          ownerId: currentUser.id
        }
      })

      if(!avaliableDomain) throw new NotFoundException('Domain not found')

      await this.dbService.domain.update({
        where: { id: domainID, ownerId: currentUser.id },
        data: { 
          ...dto,
          // domainMembers: {
          //   updateMany: {
          //     where: {
          //       domainId: domainID
          //     },
          //     data: dto.domainMembers.map(member => ({
          //       userId: member
          //     }))
          //   }
          // }
        },
      });

      throw new HttpException('Updated', HttpStatus.ACCEPTED)

    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(userID: string, dto: CreateDomainDTO) {
    try {
      const domain = await this.dbService.domain.create({
        data: {
          ...dto,
          domainMembers: {
            create: {
              memberRole: Roles.owner,
              userId: userID
            }
          },
          ownerId: userID
        },
      });

      await this.dbService.domainMembership.create({
        data: {
          domainId: domain.id,
          userId: userID,
          memberRole: Roles.owner,
        },
      });
      
      return domain
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteDomain(domainID: string, userId: string) {
    try {
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

      if(!domainToBeDeleted) {
        throw new NotFoundException();
      } else if (allDomains.length <= 1) {
        throw new ConflictException('You need at least one domain to be available');
      }

      for(const task of domainToBeDeleted.tasks) {
        await this.dbService.task.delete({
          where: {
            id: task.id
          }
        })
      }

      for(const status of domainToBeDeleted.status) {
        await this.dbService.status.delete({
          where: {
            id: status.id
          }
        })
      }

      for(const panel of domainToBeDeleted.panels) {
        await this.dbService.panel.delete({
          where: {
            id: panel.id
          }
        })
      }

      for(const announcement of domainToBeDeleted.announcements) {
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
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException(error.message)
    }
  }
}
