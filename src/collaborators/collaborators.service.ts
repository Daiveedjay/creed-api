/* eslint-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddCollaboratorDto, DemotingAndPromotingCollaboratorsDto, JoinCollaboratorDto, RemovingCollaboratorsDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateOTP } from 'otp-agent';
import { InvitePayload } from 'src/types';
import { UserService } from 'src/user/user.service';
import { DomainService } from 'src/domain/domain.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly domainService: DomainService,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async createLinkForJoining(
    addCollaboratorDto: AddCollaboratorDto,
    email: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const otp = generateOTP({ length: 4, numbers: true, alphabets: true });

    const currentUser = await this.dbService.user.findUnique({
      where: {
        email,
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException('No access');
    }

    const existingDomain = await this.dbService.domain.findUnique({
      where: {
        id: addCollaboratorDto.domainId,
      },
    });

    if (!existingDomain) {
      throw new NotFoundException('Domain not found!');
    }

    const payload: InvitePayload = {
      otp,
      domainName: existingDomain.name,
      domainId: existingDomain.id,
      createdAt: new Date(),
      role: addCollaboratorDto.role,
      expiredAt: expiresAt,
      invitedBy: {
        id: currentUser.id,
        name: currentUser.fullName,
        jobTitle: currentUser.jobTitle
      },
    };

    const hashedPayload = new JwtService().sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
    });

    return `https://kreed.tech/invite?invite_code=${hashedPayload}`;

  }

  async joinThroughLink(joinCollaboratorDto: JoinCollaboratorDto) {
    const todaysDate = new Date()
    const inviteeUser = await this.userService.getProfileThroughEmail(
      joinCollaboratorDto.email,
    );

    const thereIsDomain = await this.domainService.getUserDomain(
      joinCollaboratorDto.invitedBy,
      joinCollaboratorDto.domainId,
    );

    if (!inviteeUser || !thereIsDomain) {
      throw new MethodNotAllowedException('Not found!')
    };

    if (inviteeUser.id === joinCollaboratorDto.invitedBy) {
      throw new ConflictException('Cannot invite yourself!')
    };

    const ownerOfDomain = await this.dbService.domain.findUnique({
      where: {
        id: joinCollaboratorDto.domainId,
        ownerId: inviteeUser.id
      }
    })

    if (ownerOfDomain) {
      throw new ConflictException('You cannot add yourself bros!')
    }

    const alreadyInDomain = await this.dbService.domainMembership.findFirst({
      where: {
        userId: inviteeUser.id,
        domainId: joinCollaboratorDto.domainId,
        memberRole: {
          in: ['admin', 'member', 'owner'],
        },
      },
    });

    if (alreadyInDomain) {
      throw new ConflictException('User is already in the domain!')
    };

    await this.dbService.domainMembership.create({
      data: {
        domainId: thereIsDomain.id,
        userId: inviteeUser.id,
        memberRole: joinCollaboratorDto.role,
      }
    });

    this.notificationGateway.sendNotification({ domain: thereIsDomain.id, message: 'You might wanna refresh though' })

    return new HttpException(
      `You have successfully joined a domain: ${thereIsDomain.name}`,
      HttpStatus.ACCEPTED,
    );
  }

  async getAllCollaboratorsInADomain(domainId: string, email: string) {
    const currentUser = await this.userService.getProfileThroughEmail(email);

    if (!currentUser) throw new UnauthorizedException('Need to be logged in');

    const currentDomainAndAccess =
      await this.domainService.getUserDomainButLimitedAccess(
        domainId,
        currentUser.id,
      );

    if (!currentDomainAndAccess)
      throw new UnauthorizedException('You do not have access!');

    const members = await this.dbService.domainMembership.findMany({
      where: {
        domainId: currentDomainAndAccess.id
      },
      select: {
        createdAt: true,
        id: true,
        memberRole: true,
        domain: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            jobTitle: true,
            department: true,
            location: true,
            profilePicture: true,
          }
        }

      }
    })

    return members;
  }

  async demotingAndPromotingAUser(domainId: string, dto: DemotingAndPromotingCollaboratorsDto) {
    const userToBePromotedOrDemoted = await this.dbService.user.findUnique({
      where: {
        id: dto.userToBeModifiedId
      }
    });

    if (!userToBePromotedOrDemoted) throw new UnauthorizedException('Need to be logged in');

    const currentDomainAndAccess =
      await this.domainService.getUserDomainButLimitedAccess(
        domainId,
        userToBePromotedOrDemoted.id,
      );

    if (!currentDomainAndAccess)
      throw new UnauthorizedException('You do not have access!');

    const currentDomainMembership = await this.dbService.domainMembership.findFirst({
      where: {
        userId: userToBePromotedOrDemoted.id,
        domainId: currentDomainAndAccess.id,
      }
    })

    if (!currentDomainMembership) throw new UnauthorizedException('There is no access i guess!')

    if (dto.action === 'promoting' && currentDomainMembership.memberRole === 'member') {
      await this.dbService.domainMembership.update({
        where: {
          id: currentDomainMembership.id
        },
        data: {
          memberRole: 'admin'
        }
      })

      return new HttpException(`${userToBePromotedOrDemoted.fullName} has leveled up!`, HttpStatus.ACCEPTED)

    } else if (dto.action === 'promoting' && (currentDomainMembership.memberRole === 'admin' || currentDomainMembership.memberRole === 'owner')) {

      throw new MethodNotAllowedException('You cannot promote someone that is already a big man!')

    } else if (dto.action === 'demoting' && currentDomainMembership.memberRole === 'admin') {

      await this.dbService.domainMembership.update({
        where: {
          id: currentDomainMembership.id
        },
        data: {
          memberRole: 'member'
        }
      })

      return new HttpException(`${userToBePromotedOrDemoted.fullName} has been benched`, HttpStatus.ACCEPTED)

    } else if (dto.action === 'demoting' && (currentDomainMembership.memberRole === 'member' || currentDomainMembership.memberRole === 'owner')) {

      throw new MethodNotAllowedException('I believe this is ment')

    } else {
      return;
    }
  }

  async removingCollaboratorFromADomain(domainId: string, email: string, dto: RemovingCollaboratorsDto) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        email
      }
    })

    const userToBeRemoved = await this.dbService.domainMembership.findFirst({
      where: {
        userId: dto.userToBeRemovedId,
        domainId,
      }
    })

    if (!currentUser || !userToBeRemoved) {
      throw new UnauthorizedException('Either you are not logged in or this user is not available!')
    }

    const domainMembership = await this.dbService.domainMembership.findFirst({
      where: {
        userId: currentUser.id,
        memberRole: {
          in: [
            'owner', 'admin'
          ]
        },
        domainId,
      }
    })

    if (!domainMembership) {
      throw new MethodNotAllowedException('You do not have permission to do this!')
    }

    const panelMembership = await this.dbService.panelMembership.findFirst({
      where: {
        userId: dto.userToBeRemovedId,
        domainId
      }
    })

    const assignedToTask = await this.dbService.assignedCollaborators.findMany({
      where: {
        userId: dto.userToBeRemovedId,
      }
    })

    if (assignedToTask.length > 0) {
      for (const task of assignedToTask) {
        await this.dbService.assignedCollaborators.delete({
          where: {
            id: task.id,
          }
        })
      }
    }

    if (panelMembership) {
      await this.dbService.panelMembership.delete({
        where: {
          id: panelMembership.id
        }
      })
    }

    await this.dbService.domainMembership.delete({
      where: {
        id: userToBeRemoved.id
      }
    })
  }
}

