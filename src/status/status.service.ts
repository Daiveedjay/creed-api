import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreateStatusDTO } from './status.dto';

@Injectable()
export class StatusService {
  constructor(private readonly dbService: DbService) { }

  async getStatus(panelID: string) {
    const status = await this.dbService.status.findMany({ where: { panelId: panelID } });
    return status;
  }

  async createStatus(panelD: string, dto: CreateStatusDTO) {
    const status = await this.dbService.status.create({
      data: {
        name: dto.name,
        panelId: panelD
      }
    });
    return status;
  }

  async editStatus(statusID: string, panelID: string, dto: CreateStatusDTO) {
    await this.dbService.status.update({ where: { id: statusID, panelId: panelID }, data: { ...dto } });
    return {
      message: "Updated",
    }
  }

  async deleteStatus(statusID: string, panelID: string) {
    await this.dbService.status.delete({ where: { id: statusID, panelId: panelID } });
    return {
      message: "Deleted",
    }
  }
}
