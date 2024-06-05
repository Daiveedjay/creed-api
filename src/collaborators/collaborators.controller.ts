/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import {
  AddCollaboratorDto,
  JoinCollaboratorDto
} from './collaborator.dto';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Collaborators')
@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post('/create-link')
  @UseGuards(AuthGuard)
  async createLinkForJoining(@Body() addCollaboratorDto: AddCollaboratorDto, @CurrentUser('email') email: string) {
    return await this.collaboratorsService.createLinkForJoining(addCollaboratorDto, email);
  }

  @Post('/join-through-link')
  async joinDomainThroughLink(@Body() joinCollaboratorDto: JoinCollaboratorDto) {
    return await this.collaboratorsService.joinThroughLink(joinCollaboratorDto)
  }
}
