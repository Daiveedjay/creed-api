import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreatePanelDTO } from './panel.dto';
@Injectable()
export class PanelService {
  constructor(private readonly dbService: DbService) {};

  async getPanels(domainID: string) {
    try {
      const panels = await this.dbService.panel.findMany({ where: { domainId: domainID } });
      return panels;
    } catch (error) {
      throw new InternalServerErrorException('Panels cannot be created!')
    }
  }

  async getPanel(domainID: string, panelID: string) {
    try {
      const panels = await this.dbService.panel.findFirst({ where: { domainId: domainID, id: panelID } });
      return panels;
    } catch (error) {
      throw new InternalServerErrorException('Panels cannot be created!')
    }
  }

  async createPanel(domainID: string, dto: CreatePanelDTO) {
    try {
      const panels = await this.dbService.panel.create({
        data: {
          name: dto.name,
          domainId: domainID
        }
      });
      return panels;
    } catch (error) {
      throw new InternalServerErrorException('Panels cannot be created!')
    }
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
