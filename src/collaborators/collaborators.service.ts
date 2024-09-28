/* eslint-disable prettier/prettier */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddCollaboratorDto, DemotingAndPromotingCollaboratorsDto, InviteEmailsDto, JoinCollaboratorDto, RemovingCollaboratorsDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateOTP } from 'otp-agent';
import { InvitePayload } from 'src/types';
import { UserService } from 'src/user/user.service';
import { DomainService } from 'src/domain/domain.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { EmailService } from 'src/utils/email.service';
import { AnnouncementsService } from 'src/announcements/announcements.service';
import { getEmailSubject, getEmailTemplate } from 'src/utils/email-template';
import { Format } from 'src/utils/email-template';
import { TimeService } from 'src/utils/time.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectQueue('collaboratorEmailQueue')
    private readonly emailQueue: Queue,
    private readonly emailService: EmailService,
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly domainService: DomainService,
    private readonly notificationGateway: NotificationGateway,
    private readonly announcementService: AnnouncementsService,
    private readonly timeService: TimeService
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
        jobTitle: currentUser.jobTitle,
        profilePicture: currentUser.profilePicture
      },
    };

    const hashedPayload = new JwtService().sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
    });

    return `https://app.kreed.tech/invite?invite_code=${hashedPayload}`;

  }

  async joinThroughLink(joinCollaboratorDto: JoinCollaboratorDto) {
    const inviteeUser = await this.userService.getProfileThroughEmail(
      joinCollaboratorDto.email,
    );

    const inviteeDomains = await this.domainService.getUserDomains(inviteeUser.id)

    if (inviteeDomains.length === 3) {
      throw new ConflictException('Max number amount of domains exceeded')
    }

    const invitedByUser = await this.dbService.user.findUnique({
      where: {
        id: joinCollaboratorDto.invitedBy
      }
    })

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

    await Promise.all([
      this.dbService.domainMembership.create({
        data: {
          domainId: thereIsDomain.id,
          userId: inviteeUser.id,
          memberRole: joinCollaboratorDto.role,
        }
      }),

      this.notificationGateway.globalWebSocketFunction({
        domain: thereIsDomain.id,
        message: `@${invitedByUser.fullName} invited @${inviteeUser.fullName} to the "${thereIsDomain.name}" domain`
      }, 'joined-domain'),

      this.announcementService.create(invitedByUser.email, joinCollaboratorDto.domainId, {
        content: `@${invitedByUser.fullName} invited @${inviteeUser.fullName} to the "${thereIsDomain.name}" domain`,
        mentions: [inviteeUser.id],
        isAutomated: true,
      })
    ])

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
            fullName: true,
            username: true,
            jobTitle: true,
            department: true,
            location: true,
            profilePicture: true,
            availableHoursTo: true,
            availableHoursFrom: true
          }
        }

      }
    })

    return members;
  }

  async demotingAndPromotingAUser(domainId: string, dto: DemotingAndPromotingCollaboratorsDto, email: string) {
    const currentUser = await this.dbService.domainMembership.findFirst({
      where: {
        user: {
          email
        },
        domainId,
        memberRole: {
          in: ['owner', 'admin']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })
    if (!currentUser) {
      throw new MethodNotAllowedException('You cannot demote yourself')
    };

    const userToBePromotedOrDemoted = await this.dbService.user.findUnique({
      where: {
        id: dto.userToBeModifiedId
      },
    });

    if (!userToBePromotedOrDemoted) throw new UnauthorizedException('Need to be logged in');

    const currentDomainAndAccess =
      await this.domainService.getUserDomainButLimitedAccess(
        domainId,
        userToBePromotedOrDemoted.id,
      );

    if (!currentDomainAndAccess)
      throw new UnauthorizedException('This user doesnt exist here!');

    const currentDomainMembership = await this.dbService.domainMembership.findFirst({
      where: {
        userId: userToBePromotedOrDemoted.id,
        domainId: currentDomainAndAccess.id,
      }
    })

    if (!currentDomainMembership) throw new UnauthorizedException('This man is not in this domain')

    if (dto.action === 'promoting' && currentDomainMembership.memberRole === 'member') {
      await Promise.all([
        this.dbService.domainMembership.update({
          where: {
            id: currentDomainMembership.id
          },
          data: {
            memberRole: 'admin'
          }
        }),

        this.notificationGateway.globalWebSocketFunction({
          domain: domainId,
          message: `@${currentUser.user.fullName} promoted @${userToBePromotedOrDemoted.fullName} to Admin`
        }, 'update-role'),

        this.announcementService.create(currentUser.user.email, domainId, {
          content: `@${currentUser.user.fullName} promoted @${userToBePromotedOrDemoted.fullName} to Admin`,
          mentions: [userToBePromotedOrDemoted.id],
          isAutomated: true
        })
      ])

      const userToBePromotedOrDemotedName = userToBePromotedOrDemoted.fullName.split(' ')
      const subject = getEmailSubject(Format.GETTING_PROMOTED, {
        domainName: currentDomainAndAccess.name
      })
      const body = getEmailTemplate(Format.GETTING_PROMOTED, userToBePromotedOrDemotedName[0], {
        domainName: currentDomainAndAccess.name,
        domainUrl: ''
      })
      const now = new Date()

      if (this.timeService.isWithinAvailableHours(now, {
        start: userToBePromotedOrDemoted.availableHoursFrom,
        end: userToBePromotedOrDemoted.availableHoursTo
      })) {
        await this.emailService.sendEmail(userToBePromotedOrDemoted.email, subject, body)
      } else {
        const nextAvailableTime = this.timeService.nextAvailableDate(now, {
          start: userToBePromotedOrDemoted.availableHoursFrom,
          end: userToBePromotedOrDemoted.availableHoursTo
        });
        const delay = this.timeService.differenceInMilliseconds(now, nextAvailableTime);

        await this.emailQueue.add(
          'sendEmail',
          { email: userToBePromotedOrDemoted.email, subject, body },
          { delay }
        );
      }

      return new HttpException(`${userToBePromotedOrDemoted.fullName} has leveled up!`, HttpStatus.ACCEPTED)

    } else if (dto.action === 'promoting' && (currentDomainMembership.memberRole === 'admin' || currentDomainMembership.memberRole === 'owner')) {

      throw new MethodNotAllowedException('You cannot promote someone that is already a big man!')

    } else if (dto.action === 'demoting' && currentDomainMembership.memberRole === 'admin') {

      await Promise.all([
        this.dbService.domainMembership.update({
          where: {
            id: currentDomainMembership.id
          },
          data: {
            memberRole: 'member'
          }
        }),

        this.notificationGateway.globalWebSocketFunction({
          domain: domainId,
          message: `@${currentUser.user.fullName} demoted @${userToBePromotedOrDemoted.fullName} to Member`
        }, 'update-role'),

        this.announcementService.create(currentUser.user.email, domainId, {
          content: `@${currentUser.user.fullName} demoted @${userToBePromotedOrDemoted.fullName} to Member`,
          mentions: [userToBePromotedOrDemoted.id],
          isAutomated: true
        })
      ])

      const userToBePromotedOrDemotedName = userToBePromotedOrDemoted.fullName.split(' ')
      const subject = getEmailSubject(Format.GETTING_DEMOTED, {
        domainName: currentDomainAndAccess.name
      })
      const body = getEmailTemplate(Format.GETTING_DEMOTED, userToBePromotedOrDemotedName[0], {
        domainName: currentDomainAndAccess.name,
      })
      await this.emailService.sendEmail(userToBePromotedOrDemoted.email, subject, body)

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

    const particularDomain = await this.dbService.domain.findUnique({
      where: {
        id: domainId
      }
    })

    const userToBeRemoved = await this.dbService.domainMembership.findFirst({
      where: {
        userId: dto.userToBeRemovedId,
        domainId,
      },
      include: {
        user: {
          select: {
            email: true,
            fullName: true
          }
        },
        domain: {
          select: {
            name: true
          }
        }
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

    const panelsCreatedByUserToBeRemoved = await this.dbService.panel.findMany({
      where: {
        ownerId: dto.userToBeRemovedId
      }
    })

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

    if (panelsCreatedByUserToBeRemoved) {
      for (const panel of panelsCreatedByUserToBeRemoved) {
        await this.dbService.panel.update({
          where: {
            id: panel.id
          },
          data: {
            ownerId: particularDomain.ownerId
          }
        })
      }
    }

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

    await Promise.all([
      this.dbService.domainMembership.delete({
        where: {
          id: userToBeRemoved.id
        }
      }),

      this.notificationGateway.globalWebSocketFunction({
        domain: domainId,
        message: `@${currentUser.fullName} removed ${userToBeRemoved.user.fullName} from the "${particularDomain.name}" domain`
      }, 'removed-domain'),

      this.announcementService.create(currentUser.email, domainId, {
        content: `@${currentUser.fullName} removed ${userToBeRemoved.user.fullName} from the "${particularDomain.name}" domain`,
        mentions: [userToBeRemoved.id],
        isAutomated: true
      })
    ])

    const userToBePromotedOrDemotedName = userToBeRemoved.user.fullName.split(' ')
    const subject = getEmailSubject(Format.REMOVED_DOMAIN, {
      domainName: particularDomain.name
    })
    const body = getEmailTemplate(Format.REMOVED_DOMAIN, userToBePromotedOrDemotedName[0], {
      domainName: particularDomain.name,
    })
    await this.emailService.sendEmail(userToBeRemoved.user.email, subject, body)
  }

  async sendCollaborationInviteEmails(userEmail: string, dto: InviteEmailsDto) {
    const domain = await this.dbService.domain.findUnique({
      where: {
        id: dto.domainId
      },
    })
    for (const email of dto.usersEmails) {
      const userInvited = await this.dbService.user.findUnique({
        where: {
          email
        },
        select: {
          fullName: true
        }
      })

      const link = await this.createLinkForJoining({
        domainId: dto.domainId,
        role: dto.role,
      }, userEmail)

      const userToBeInvitedName = userInvited.fullName ? userInvited.fullName.split(' ')[0] : ''
      const subject = getEmailSubject(Format.INVITED_TO_DOMAIN, {
        domainName: domain.name
      })
      const body = getEmailTemplate(Format.INVITED_TO_DOMAIN, userToBeInvitedName, {
        domainName: domain.name,
        inviteUrl: link
      })

      await this.emailService.sendEmail(
        email,
        subject,
        body
      )

      return new HttpException('Email sent!', HttpStatus.OK)
    }
  }
}

