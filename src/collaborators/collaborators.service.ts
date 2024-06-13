/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AddCollaboratorDto, JoinCollaboratorDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateOTP } from "otp-agent";
import { InvitePayload } from 'src/types';
import { UserService } from 'src/user/user.service';
import { DomainService } from 'src/domain/domain.service';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly domainService: DomainService,
  ) {}

  async createLinkForJoining(addCollaboratorDto: AddCollaboratorDto, email: string) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1)
      const otp = generateOTP({ length: 4, numbers: true, alphabets: true });

      const currentUser = await this.dbService.user.findUnique({
        where: {
          email,
        }
      })

      if(!currentUser) {
        throw new UnauthorizedException('No access')
      }

      const existingDomain = await this.dbService.domain.findUnique({
        where: {
          id: addCollaboratorDto.domainId,
        }
      })

      if(!existingDomain) {
        throw new NotFoundException('Domain not found!')
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
          name: currentUser.fullName
        }
      }

      const hashedPayload = new JwtService().sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
      })

      return `https://kreed.tech/invite?invite_code=${hashedPayload}`; 
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }


  async joinThroughLink(joinCollaboratorDto: JoinCollaboratorDto) {
    const inviteeUser = await this.userService.getProfileThroughEmail(joinCollaboratorDto.email)
  
    const decodedPayload: InvitePayload = new JwtService().verify(joinCollaboratorDto.inviteCode, {
      secret: this.configService.get('JWT_SECRET'),
    });

    if(!decodedPayload) {
      throw new UnauthorizedException('No access!');
    };

    // if(decodedPayload.expiredAt < new Date()) throw new ConflictException('Link has been expired!');

    const thereIsDomain = await this.domainService.getUserDomain(decodedPayload.invitedBy.id, decodedPayload.domainId)

    const alreadyInDomain = await this.dbService.domainMembership.findFirst({
      where: {
        userId: inviteeUser.id,
        domainId: thereIsDomain.id,
        memberRole: {
          in: ['admin', 'member']
        }
      }
    });

    if(alreadyInDomain) {
      return new HttpException('Already in domain', HttpStatus.FOUND)
    };

    try {
      await this.dbService.domain.update({
        where: {
          id: thereIsDomain.id
        },
        data: {
          domainMembers: {
            create: {
              userId: inviteeUser.id,
              memberRole: decodedPayload.role
            }
          }
        }
      })

      return new HttpException(`You have successfully joined a domain: ${thereIsDomain.name}`, HttpStatus.ACCEPTED)
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException(error.message)
    }
  }

  async getAllCollaboratorsInADomain(domainId: string, email: string) {
    const currentUser = await this.userService.getProfileThroughEmail(email)

    if(!currentUser) throw new UnauthorizedException('Need to be logged in');

    const currentDomainAndAccess = await this.domainService.getUserDomainButLimitedAccess(domainId, currentUser.id)

    if(!currentDomainAndAccess) throw new UnauthorizedException('You do not have access!')

      try {
        const members = await this.dbService.domainMembership.findMany({
          where: {
            domainId: currentDomainAndAccess.id,
          },
          select: {
            user: {
              select: {
                id: true,
                email: true,
                department: true,
                location: true,
                fullName: true,
                username: true,
                profilePicture: true,
                jobTitle: true
              }
            },
            domainId: true,
            memberRole: true,
            id: true,
          },
        })

        return members;
      } catch (error) {
        console.log(error)
        throw new InternalServerErrorException('Cannot fetch the collaborators')
      }
  }
}
