/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
      throw new InternalServerErrorException('Panels have misplaced!!');
    }
  }

  async getPanel(domainID: string, panelID: string) {
    try {
      const panels = await this.dbService.panel.findUnique({
        where: { domainId: domainID, id: panelID },
      });
      return panels;
    } catch (error) {
      throw new InternalServerErrorException('Panels no dey available!');
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
        currentUser.memberRole === 'member' ||
        currentUser.memberRole === 'admin'
      )
        throw new UnauthorizedException('No access!');

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
    try {
      const existingPanel = await this.dbService.panel.findUnique({
        where: {
          domainId: domainID, id: panelID
        }
      })

      if(!existingPanel) throw new NotFoundException('Panel not found!')

      await this.dbService.panel.update({
        where: {
          id: panelID,
          domainId: domainID
        },
        data: {
          ...dto
        }
      });
  
      return new HttpException('Updated', HttpStatus.ACCEPTED);
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async deletePanel(doaminID: string, panelID: string) {
    try {
      const existingPanel = await this.dbService.panel.findUnique({
        where: {
          id: panelID,
          domainId: doaminID, 
        },
        include: {
          panelMembers: true,
          tasks: true,
        }
      })

      if(!existingPanel) throw new NotFoundException('Panel not found!')

      for(const task of existingPanel.tasks) {
        await this.dbService.task.delete({
          where: {
            id: task.id
          }
        })
      }

      await this.dbService.panel.delete({
        where: { domainId: doaminID, id: panelID },
      });
      
      return new HttpException('Deleted', HttpStatus.ACCEPTED);
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
