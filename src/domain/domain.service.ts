/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateDomainDTO } from './domain.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class DomainService {
  constructor(private readonly dbService: DbService) {}

  async getUserDomains(userID: string) {
    try {
      return await this.dbService.domain.findMany({
        where: {
          OR: [
            { ownerId: userID },
            { domainMembers: { some: { userId: userID } } },
          ],
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserDomain(userID: string, doaminID: string) {
    try {
      return await this.dbService.domain.findFirst({
        where: {
          id: doaminID,
          OR: [
            { ownerId: userID },
            { domainMembers: { some: { userId: userID } } },
          ],
        },
      });
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

      return new HttpException('Updated', HttpStatus.ACCEPTED)

    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(userID: string, dto: CreateDomainDTO) {
    try {
      const domain = await this.dbService.domain.create({
        data: {
          ...dto,
          // domainMembers: {
          //   createMany: {
          //     data: dto.domainMembers.map((member) => ({
          //       userId: member
          //     }))
          //   }
          // },
          ownerId: userID
        },
      });

      await this.dbService.domainMembership.create({
        data: {
          domainId: domain.id,
          userId: userID,
          memberRole: Roles.Owner,
        },
      });
      
      return new HttpException('Created', HttpStatus.CREATED)
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteDomain(domainID: string) {
    await this.dbService.domain.delete({ where: { id: domainID } });
    return {
      message: 'Deleted',
    };
  }
}
