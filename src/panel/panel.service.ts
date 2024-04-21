import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreatePanelDTO } from './panel.dto';

@Injectable()
export class PanelService {
  constructor(private readonly dbService: DbService) { }


  async getPanels(domainID: string) {
    const panels = await this.dbService.panel.findMany({ where: { domainId: domainID } });
    return panels;
  }

  async getPanel(domainID: string, panelID: string) {
    const panels = await this.dbService.panel.findFirst({ where: { domainId: domainID, id: panelID } });
    return panels;
  }

  async createPanel(domainID: string, dto: CreatePanelDTO) {
    const panels = await this.dbService.panel.create({
      data: {
        name: dto.name,
        domainId: domainID
      }
    });
    return panels;
  }

  async editPanel(doaminID: string, panelID: string, dto: CreatePanelDTO) {
    await this.dbService.panel.update({ where: { domainId: doaminID, id: panelID }, data: { ...dto } });
    return {
      message: "Updated",
    }
  }

  async deletePanel(doaminID: string, panelID: string) {
    await this.dbService.panel.delete({ where: { domainId: doaminID, id: panelID } });
    return {
      message: "Deleted",
    }
  }
}
