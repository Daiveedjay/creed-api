/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { CreatePanelDTO } from './panel.dto';
@Injectable()
export class PanelService {
  constructor(private readonly dbService: DbService) {}

  async getPanels(domainID: string) {
    try {
      const panels = await this.dbService.panel.findMany({
        where: { domainId: domainID },
      });
      return panels;
    } catch (error) {
      throw new InternalServerErrorException('Panels cannot be created!');
    }
  }

  async getPanel(domainID: string, panelID: string) {
    try {
      const panels = await this.dbService.panel.findFirst({
        where: { domainId: domainID, id: panelID },
      });
      return panels;
    } catch (error) {
      throw new InternalServerErrorException('Panels cannot be created!');
    }
  }

  async createPanel(domainID: string, userId: string, dto: CreatePanelDTO) {
    try {
      const currentUser = await this.dbService.domainMembership.findFirst({
        where: {
          userId,
        },
      });

      if (
        !currentUser ||
        currentUser.memberRole === 'Member' ||
        currentUser.memberRole === 'Admin'
      )
        throw new UnauthorizedException();

      const panels = await this.dbService.panel.create({
        data: {
          name: dto.name,
          domainId: domainID,
        },
      });

      return panels;
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Panels cannot be created!');
    }
  }

  async editPanel(domainID: string, panelID: string, dto: CreatePanelDTO) {
    await this.dbService.panel.update({
      where: { domainId: domainID, id: panelID },
      data: { ...dto },
    });
    return {
      message: 'Updated',
    };
  }

  async deletePanel(doaminID: string, panelID: string) {
    await this.dbService.panel.delete({
      where: { domainId: doaminID, id: panelID },
    });
    return {
      message: 'Deleted',
    };
  }
}
