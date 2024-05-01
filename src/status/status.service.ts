import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateStatusDTO } from './status.dto';

@Injectable()
export class StatusService {
  constructor(private readonly dbService: DbService) {}

  async getStatus(domainID: string) {
    try {
      const status = await this.dbService.status.findMany({ where: { domainId: domainID } });
      return status;
    } catch (error) {
      throw new InternalServerErrorException('Cannot get status')
    }
  }

  async createStatus(domainID: string, dto: CreateStatusDTO) {
    try {
      const status = await this.dbService.status.create({
        data: {
          name: dto.name,
          domainId: domainID
        }
      });
      return status;
    } catch (error) {
      throw new InternalServerErrorException('Status cannot be created!')
    }
  }

  async editStatus(statusID: string, domainId: string, dto: CreateStatusDTO) {
    await this.dbService.status.update({ where: { id: statusID, domainId: domainId }, data: { ...dto } });
    return {
      message: "Updated",
    }
  }

  async deleteStatus(statusID: string, domainId: string) {
    await this.dbService.status.delete({ where: { id: statusID, domainId, } });
    return {
      message: "Deleted",
    }
  }
}
