import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateDomainDTO, UpdateDefaultDomainDTO } from './domain.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class DomainService {
  constructor(private readonly dbService: DbService) { }

  async getUserDomains(userID: string) {
    return this.dbService.domain.findMany({ where: { OR: [{ ownerId: userID }, { domainMembers: { some: { userId: userID } } }] } })
  }

  async getUserDomain(userID: string, doaminID: string) {
    return this.dbService.domain.findFirst({ where: { id: doaminID, OR: [{ ownerId: userID }, { domainMembers: { some: { userId: userID } } }] } })
  }

  async update(userID, dto: CreateDomainDTO, domainID: string) {
    const domain = await this.dbService.domain.update({
      where: { id: domainID, ownerId: userID },
      data: { ...dto }
    });

    return {
      message: "Updated"
    }
  }

  async create(userID, dto: CreateDomainDTO) {
    const domain = await this.dbService.domain.create({
      data: { ...dto, ownerId: userID }
    });
    await this.dbService.domainMembership.create({
      data: {
        domainId: domain.id,
        userId: userID,
        memberRole: Roles.Owner
      }
    })
    return {
      message: "Created"
    };
  }

  async deleteDomain(domainID: string) {
    await this.dbService.domain.delete({ where: { id: domainID } });
    return {
      message: "Deleted",
    }
  }
}
