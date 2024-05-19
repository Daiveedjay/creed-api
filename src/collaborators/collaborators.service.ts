/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AddCollaboratorDto, UpdateCollaboratorDto } from './collaborator.dto';
import { DbService } from 'src/utils/db.service';
import * as bcrypt from 'bcrypt';

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

      return `https://yourdomain.com?domain=${addCollaboratorDto.domainId}&role=${addCollaboratorDto.role}&expires=${hashedExpiredAt}`; 
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}