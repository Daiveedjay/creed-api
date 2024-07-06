/* eslINt-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { AddUsersDto, CreatePanelDTO } from './panel.dto';
@Injectable()
export class PanelService {
  constructor(private readonly dbService: DbService) { }

  async getPanels(domainID: string, id: string) {
    try {
      const currentUser = await this.dbService.user.findUnique({
        where: {
          id
        },
      });

      if (!currentUser) throw new UnauthorizedException('No user!');

      const domain = await this.dbService.domain.findUnique({
        where: {
          id: domainID,
        },
      });

      if (!domain) throw new NotFoundException('Domain does not exist!');

      if (domain.ownerId === currentUser.id) {
        return await this.dbService.panel.findMany({
          where: {
            domainId: domainID,
          },
        });
      } else {
        const domainMembership = await this.dbService.domainMembership.findFirst({
          where: {
            userId: currentUser.id,
            domainId: domainID,
            memberRole: {
              in: ['member', 'admin'],
            },
          },
        });

        if (!domainMembership)
          throw new UnauthorizedException('No access to this domain!');

        const panels = await this.dbService.panel.findMany({
          where: {
            domainId: domainID,
            panelMembers: {
              some: {
                userId: currentUser.id,
              },
            },
          },
        });

        return panels;

      }
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Panels have misplaced!!');
    }
  }

  async getPanel(domainID: string, panelID: string, id: string) {
    try {
      const currentUser = await this.dbService.user.findUnique({
        where: {
          id
        },
      });

      if (!currentUser) throw new UnauthorizedException('No user!');

      const domain = await this.dbService.domain.findUnique({
        where: {
          id: domainID,
        },
      });

      if (!domain) throw new NotFoundException('Domain does not exist!');
      const panel = await this.dbService.panel.findUnique({
        where: {
          id: panelID,
          domainId: domainID,
        },
      });

      const domainMembership = await this.dbService.domainMembership.findFirst({
        where: {
          userId: currentUser.id,
          domainId: domainID,
          memberRole: {
            in: ['member', 'owner', 'admin'],
          },
        },
      });

      if (!domainMembership)
        throw new UnauthorizedException('No access to this domain!');

      const panelMembership = await this.dbService.panelMembership.findFirst({
        where: {
          userId: currentUser.id,
          domainId: domainID,
          panelId: panelID,
        }
      });

      if (!panelMembership) throw new UnauthorizedException('No access to this panel!')


      if (!panel) throw new NotFoundException('Thee did not find this request!')

      const panelMembers = await this.dbService.panelMembership.findMany({
        where: {
          panelId: panelID,
          domainId: domainID,
        }
      });

      const payload = {
        panel_data: panel,
        panel_members: panelMembers
      }

      return payload;

    } catch (error) {
      throw new InternalServerErrorException('Panels no dey available!');
    }
  }

  async createPanel(domainID: string, userId: string, dto: CreatePanelDTO) {
    try {
      const currentUser = await this.dbService.domainMembership.findFirst({
        where: {
          userId,
          memberRole: {
            in: ['admin', 'owner'],
          },
        },
      });

      if (!currentUser) throw new UnauthorizedException('No access!');

      const panel = await this.dbService.panel.create({
        data: {
          name: dto.name,
          domainId: domainID,
        },
      });

      await this.dbService.panelMembership.create({
        data: {
          userId: currentUser.userId,
          domainId: domainID,
          panelId: panel.id,
        }
      })

      return panel;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Panels cannot be created!');
    }
  }

  async addUsersToPanel(
    domainID: string,
    panelID: string,
    id: string,
    addUsersDto: AddUsersDto,
  ) {

    const existingPanel = await this.dbService.panel.findUnique({
      where: {
        domainId: domainID,
        id: panelID,
      },
    });

    const currentUser = await this.dbService.user.findUnique({
      where: {
        id,
      },
    });

    if (!existingPanel) throw new NotFoundException('Panel not found!');

    const currentUserMembership =
      await this.dbService.domainMembership.findFirst({
        where: {
          userId: currentUser.id,
          memberRole: {
            in: ['admin', 'owner'],
          },
        },
      });

    if (!currentUser || !currentUserMembership)
      throw new UnauthorizedException('No access!');

    for (const id of addUsersDto.userIds) {
      const availableUser = await this.dbService.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicture: true
        }
      });
      console.log({ availableUser, id })

      if (!availableUser) throw new NotFoundException('No user like this');

      const confirmations = await this.dbService.domainMembership.findFirst({
        where: {
          userId: availableUser.id,
          memberRole: {
            in: ['admin', 'member'],
          },
        },
      });

      if (!confirmations)
        throw new NotFoundException('Some users are not his domain');

      const alreadyInPanel = await this.dbService.panelMembership.findFirst({
        where: {
          userId: availableUser.id,
          panelId: panelID,
          domainId: domainID,
        }
      })

      if (alreadyInPanel) throw new ConflictException('Thee is already in thy panel, kind sir')
    }

    await this.dbService.panelMembership.createMany({
      data: addUsersDto.userIds?.map((user) => ({
        userId: user,
        domainId: domainID,
        panelId: panelID,
      })),
    });

    return new HttpException('Success', HttpStatus.CREATED)
  }

  async editPanel(domainID: string, panelID: string, dto: CreatePanelDTO) {
    try {
      const existingPanel = await this.dbService.panel.findUnique({
        where: {
          domainId: domainID,
          id: panelID,
        },
      });

      if (!existingPanel) throw new NotFoundException('Panel not found!');

      await this.dbService.panel.update({
        where: {
          id: panelID,
          domainId: domainID,
        },
        data: {
          ...dto,
        },
      });

      return new HttpException('Updated', HttpStatus.ACCEPTED);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
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
        },
      });

      if (!existingPanel) throw new NotFoundException('Panel not found!');

      for (const task of existingPanel.tasks) {
        await this.dbService.task.delete({
          where: {
            id: task.id,
          },
        });
      }

      await this.dbService.panel.delete({
        where: { domainId: doaminID, id: panelID },
      });

      return new HttpException('Deleted', HttpStatus.ACCEPTED);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
