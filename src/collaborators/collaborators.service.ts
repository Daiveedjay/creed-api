/* eslint-disable prettier/prettier */
import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AddCollaboratorDto, JoinCollaboratorDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateOTP } from "otp-agent";
import { InvitePayload } from 'src/types';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService
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
    try {
      const inviteeUser = await this.dbService.user.findUnique({
        where: { email: joinCollaboratorDto.email },
      });
  
      if(!inviteeUser) {
        throw new NotFoundException('No user found');
      };
  
      const decodedPayload: InvitePayload = new JwtService().verify(joinCollaboratorDto.inviteCode, {
        secret: this.configService.get('JWT_SECRET'),
      });
  
      if(!decodedPayload) {
        throw new UnauthorizedException('No access!');
      };
  
      if(decodedPayload.expiredAt < new Date()) throw new ConflictException('Link has been expired!');
  
      const thereIsDomain = await this.dbService.domain.findUnique({
        where: {
          id: decodedPayload.domainId
        }
      })
      
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
      throw new InternalServerErrorException('Cannot join bros!')
    }
  }
}