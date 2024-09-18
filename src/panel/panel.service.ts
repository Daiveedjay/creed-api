/* eslINt-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { AddUsersDto, CreatePanelDTO, DeleteUserDto } from './panel.dto';
import { EmailService } from 'src/utils/email.service';

@Injectable()
export class PanelService {
  constructor(
    private readonly emailService: EmailService,
    private readonly dbService: DbService
  ) { }

  async getPanels(domainID: string, id: string) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        id,
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
          panelMembers: {
            some: {
              domainId: domainID,
              userId: currentUser.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return panels;
    }
  }

  async getPanel(domainID: string, panelID: string, id: string) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        id,
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

    const ownerOfDomain = await this.dbService.domain.findUnique({
      where: {
        ownerId: currentUser.id,
        id: domainID
      }
    })

    if (!domainMembership)
      throw new UnauthorizedException('No access to this domain!');

    if (!ownerOfDomain) {
      const panelMembership = await this.dbService.panelMembership.findFirst({
        where: {
          userId: currentUser.id,
          domainId: domainID,
          panelId: panelID,
        },
      });

      if (!panelMembership)
        throw new UnauthorizedException('No access to this panel!');

      if (!panel) throw new NotFoundException('Thee did not find this request!');

      const panelMembers = await this.dbService.panelMembership.findMany({
        where: {
          panelId: panelID,
          domainId: domainID,
        },
        select: {
          createdAt: true,
          domainId: true,
          id: true,
          panelId: true,
          user: {
            select: {
              id: true,
              fullName: true,
              profilePicture: true,
              username: true,
            },
          },
        },
      });

      const payload = {
        panel_data: panel,
        panel_members: panelMembers,
      };

      return payload;
    } else {
      const panelMembers = await this.dbService.panelMembership.findMany({
        where: {
          panelId: panelID,
          domainId: domainID,
        },
        select: {
          createdAt: true,
          domainId: true,
          id: true,
          panelId: true,
          user: {
            select: {
              id: true,
              fullName: true,
              profilePicture: true,
              username: true,
            },
          },
        },
      });

      const payload = {
        panel_data: panel,
        panel_members: panelMembers,
      };

      return payload
    }
  }

  async createPanel(domainID: string, userId: string, dto: CreatePanelDTO) {
    const currentUser = await this.dbService.domainMembership.findFirst({
      where: {
        userId,
        memberRole: {
          in: ['admin', 'owner'],
        },
      },
    });

    const particularDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainID,
      },
    });

    if (!currentUser) throw new UnauthorizedException('No access!');

    if (!particularDomain) throw new NotFoundException('No domain found');

    const panel = await this.dbService.panel.create({
      data: {
        name: dto.name,
        ownerId: currentUser.userId,
        domainId: particularDomain.id,
      },
    });

    await this.dbService.panelMembership.create({
      data: {
        userId: currentUser.userId,
        domainId: domainID,
        panelId: panel.id,
      },
    });

    return panel;
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
          email: true,
          fullName: true,
          profilePicture: true,
        },
      });

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
        },
      });

      if (alreadyInPanel)
        throw new ConflictException('Thee is already in thy panel, kind sir');
    }

    const users = await this.dbService.user.findMany({
      where: {
        id: {
          in: addUsersDto.userIds
        }
      },
      select: {
        email: true
      }
    })
    const usersEmails = users.map((user) => user.email)

    await Promise.all([
      this.dbService.panelMembership.createMany({
        data: addUsersDto.userIds?.map((user) => ({
          userId: user,
          domainId: domainID,
          panelId: panelID,
        })),
      }),

      this.emailService.sendMultipleEmails(usersEmails, 'ANything abeg!', 'Free me you have been added to panel abeg!')
    ])

    return new HttpException('Success', HttpStatus.CREATED);
  }

  async removeAUserFromPanel(
    domainID: string,
    panelID: string,
    email: string,
    deleteUserDto: DeleteUserDto,
  ) {
    const existingPanel = await this.dbService.panel.findUnique({
      where: {
        domainId: domainID,
        id: panelID,
      },
    });

    const currentUser = await this.dbService.user.findUnique({
      where: {
        email,
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

    for (const id of deleteUserDto.panelMembersId) {
      const panelMembership = await this.dbService.panelMembership.findFirst({
        where: {
          userId: id,
          domainId: domainID,
          panelId: panelID,
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

      if (!panelMembership) throw new ConflictException('No such member here!');

      await Promise.all([
        this.dbService.assignedCollaborators.deleteMany({
          where: {
            userId: id,
          }
        }),

        this.dbService.panelMembership.delete({
          where: {
            id: panelMembership.id,
          },
        }),


        this.emailService.sendEmail(panelMembership.user.email, 'ANything abeg!', 'You have been rremoved abeg, Fuvk off!')

      ])

      return new HttpException('Success', HttpStatus.CREATED);
    }
  }

  async editPanel(domainID: string, panelID: string, dto: CreatePanelDTO) {
    const existingPanel = await this.dbService.panel.findUnique({
      where: {
        domainId: domainID,
        id: panelID,
      },
    });

    if (!existingPanel) throw new NotFoundException('Panel not found!');

    const updatedPanel = await this.dbService.panel.update({
      where: {
        id: panelID,
        domainId: domainID,
      },
      data: {
        ...dto,
      },
    });

    return updatedPanel;
  }

  async deletePanel(doaminID: string, panelID: string) {
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
  }
}
