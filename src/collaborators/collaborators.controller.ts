/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Get,
  Patch
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import {
  AddCollaboratorDto,
  DemotingAndPromotingCollaboratorsDto,
  JoinCollaboratorDto,
  RemovingCollaboratorsDto
} from './collaborator.dto';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Collaborators')
@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) { }

  @Post('/create-link')
  @UseGuards(AuthGuard)
  async createLinkForJoining(@Body() addCollaboratorDto: AddCollaboratorDto, @CurrentUser('email') email: string) {
    return await this.collaboratorsService.createLinkForJoining(addCollaboratorDto, email);
  }

  @Post('/join-through-link')
  async joinDomainThroughLink(
    @Body() dto: JoinCollaboratorDto,
  ) {
    return await this.collaboratorsService.joinThroughLink(dto)
  }

  @Get('/:domainId')
  @UseGuards(AuthGuard)
  async getAllCollaboratorsInADomain(@Param('domainId') domainId: string, @CurrentUser('email') email: string) {
    return await this.collaboratorsService.getAllCollaboratorsInADomain(domainId, email)
  }

  @Patch('/:domainId')
  @UseGuards(AuthGuard)
  async demoteAndPromoteACollaboratorInADomain(@Param('domainId') domainId: string, @Body() dto: DemotingAndPromotingCollaboratorsDto) {
    return await this.collaboratorsService.demotingAndPromotingAUser(domainId, dto)
  }

  @Patch('/:domainId')
  @UseGuards(AuthGuard)
  async removeACollaboratorFromADomain(@Param('domainId') domainId: string, @CurrentUser('email') email: string, @Body() dto: RemovingCollaboratorsDto) {
    return await this.collaboratorsService.removingCollaboratorFromADomain(domainId, email, dto)
  }

}
