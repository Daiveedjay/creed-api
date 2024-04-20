import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreatePanelDTO } from './panel.dto';

@Injectable()
export class PanelService {
  constructor(private readonly dbService: DbService) { }


  async getPanels(domainID: string) {
    const panels = await this.dbService.board.findMany({ where: { domainId: domainID } });
    return panels;
  }

  async getPanel(domainID: string, panelID: string) {
    const panels = await this.dbService.board.findFirst({ where: { domainId: domainID, id: panelID } });
    return panels;
  }

  async createPanel(domainID: string, dto: CreatePanelDTO) {
    const panels = await this.dbService.board.create({
      data: {
        name: dto.name,
        domainId: domainID
      }
    })
    return panels;
  }

  async deletePanel(doaminID: string, panelID: string) {
    await this.dbService.board.delete({ where: { domainId: doaminID, id: panelID } });
    return {
      message: "Deleted",
    }
  }
}
