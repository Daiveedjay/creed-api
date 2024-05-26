/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import {
  AddCollaboratorDto
} from './collaborator.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Collaborators')
@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post('/create-link')
  @UseGuards(AuthGuard)
  async createLinkForJoining(@Body() addCollaboratorDto: AddCollaboratorDto) {
    return await this.collaboratorsService.createLinkForJoining(addCollaboratorDto);
  }

  @Patch('/join-through-link')
  @UseGuards(AuthGuard)
  async joinDomainThroughLink(@Req() req: any, @Res() res: Response, @Body() joinCollaboratorDto: AddCollaboratorDto) {
    return await this.collaboratorsService.joinThroughLink(req, res, joinCollaboratorDto)
  }
}
