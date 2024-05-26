/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AddCollaboratorDto, JoinCollaboratorDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService
  ) {}

  async createLinkForJoining(addCollaboratorDto: AddCollaboratorDto) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1)

      const existingDomain = await this.dbService.domain.findUnique({
        where: {
          id: addCollaboratorDto.domainId,
        }
      })

      if(!existingDomain) throw new NotFoundException('Domain not found!')

      const hashedExpiredAt = await bcrypt.hash(String(expiresAt), 10)

      return `https://kreed.tech?domain=${addCollaboratorDto.domainId}&role=${addCollaboratorDto.role}&expires=${hashedExpiredAt}`; 
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async joinThroughLink(joinCollaboratorDto: JoinCollaboratorDto) {
    try {
      const thereIsDomain = await this.dbService.domain.findUnique({
        where: {
          id: joinCollaboratorDto.domainId
        }
      })

      const decodedToken = new JwtService().verify(joinCollaboratorDto.token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if(!decodedToken) throw new UnauthorizedException('You need to log in!');
      
      const hasAccount = await this.dbService.user.findUnique({
        where: { id: decodedToken.uid },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      });
  
      if(!thereIsDomain) {
        throw new NotFoundException('No domain')
      }

      if (!hasAccount) throw new UnauthorizedException('You need to log in!');
  
      const alreadyInDomain = await this.dbService.domainMembership.findFirst({
        where: {
          userId: hasAccount.id,
          domainId: thereIsDomain.id,
          memberRole: {
            in: ['admin', 'member']
          }
        }
      });
  
      if(alreadyInDomain) {
        return new HttpException('Already in domain', HttpStatus.FOUND)
      }
  
      await this.dbService.domain.update({
        where: {
          id: thereIsDomain.id
        },
        data: {
          domainMembers: {
            create: {
              userId: hasAccount.id,
              memberRole: joinCollaboratorDto.role
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