/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddCollaboratorDto, JoinCollaboratorDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateOTP } from 'otp-agent';
import { InvitePayload, UserPayload } from 'src/types';
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
    try {
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
        },
      };

      const hashedPayload = new JwtService().sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
      });

      return `https://kreed.tech/invite?invite_code=${hashedPayload}`;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async joinThroughLink(joinCollaboratorDto: JoinCollaboratorDto) {
    const inviteeUser = await this.userService.getProfileThroughEmail(
      joinCollaboratorDto.email,
    );

    const decodedPayload: InvitePayload = new JwtService().verify(
      joinCollaboratorDto.inviteCode,
      {
        secret: this.configService.get('JWT_SECRET'),
      },
    );

    if (!decodedPayload) {
      throw new UnauthorizedException('No access!');
    }

    // if(decodedPayload.expiredAt < new Date()) throw new ConflictException('Link has been expired!');

    const thereIsDomain = await this.domainService.getUserDomain(
      decodedPayload.invitedBy.id,
      decodedPayload.domainId,
    );

    const alreadyInDomain = await this.dbService.domainMembership.findFirst({
      where: {
        userId: inviteeUser.id,
        domainId: thereIsDomain.id,
        memberRole: {
          in: ['admin', 'member'],
        },
      },
    });

    if (alreadyInDomain) {
      return new HttpException('Already in domain', HttpStatus.FOUND);
    }

    try {
      await this.dbService.domain.update({
        where: {
          id: thereIsDomain.id,
        },
        data: {
          domainMembers: {
            create: {
              userId: inviteeUser.id,
              memberRole: decodedPayload.role,
            },
          },
        },
      });

      this.notificationGateway.sendNotification({ domain: thereIsDomain.id, message: 'You might wanna refresh though' })

      return new HttpException(
        `You have successfully joined a domain: ${thereIsDomain.name}`,
        HttpStatus.ACCEPTED,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
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

    try {
      const domains = await this.dbService.domain.findMany({
        where: {
          id: currentDomainAndAccess.id,
          OR: [
            { ownerId: currentUser.id }, // Domains created by the user
            { domainMembers: { some: { userId: currentUser.id } } }, // Domains joined by the user
          ],
        },
        include: {
          domainMembers: {
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
          }
        }
      });

      // Extract unique members
      const membersMap = {};
      for (const domain of domains) {
        for (const member of domain.domainMembers) {
          membersMap[member.user.id] = member;
        }
      }
      const uniqueMembers: UserPayload[] = Object.values(membersMap);

      return uniqueMembers;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Cannot fetch the collaborators');
    }
  }
}
