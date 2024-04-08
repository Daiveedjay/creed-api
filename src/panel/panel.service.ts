import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';

@Injectable()
export class PanelService {
  constructor(private readonly dbService: DbService) {}


  async getPanels(domainID: string) {
    const panels = await this.dbService.board.findMany({ where: { domainId: domainID }});
    return panels;
  }

  async createPanel(domainID: string) {
    const panels = await this.dbService.board.findMany({ where: { domainId: domainID }});
    return panels;
  }
}
