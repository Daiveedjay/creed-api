/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AddCollaboratorDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class CollaboratorsService {
  constructor(
    private readonly dbService: DbService
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

  async joinThroughLink(req: any, res: Response, joinCollaboratorDto: AddCollaboratorDto) {
    try {
      const thereIsDomain = await this.dbService.domain.findUnique({
        where: {
          id: joinCollaboratorDto.domainId
        }
      })
      
      const hasAccount = await this.dbService.user.findUnique({
        where: {
          email: req.user.email
        },
        select: {
          id: true,
          email: true,
          fullName: true
        }
      })
      const isAuthenticated = await this.isAuthenticated(req);
  
      if(!thereIsDomain) {
        throw new NotFoundException('No domain')
      }
  
      if (!isAuthenticated) {
        return res.redirect('/login');
      }
  
      if (!hasAccount) {
        return res.redirect('/create-account');
      }
  
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
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Cannot join bros!')
    }
  }

  async isAuthenticated(req: any): Promise<boolean> {
    return !!req.user; 
  }
}