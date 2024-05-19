/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import {
  AddCollaboratorDto,
  // CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from './collaborator.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('collaborators')
@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post('/create-link')
  @UseGuards(AuthGuard)
  async createLinkForJoining(@Body() addCollaboratorDto: AddCollaboratorDto) {
    return await this.collaboratorsService.createLinkForJoining(addCollaboratorDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.collaboratorsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.collaboratorsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCollaboratorDto: UpdateCollaboratorDto,
  ) {
    return this.collaboratorsService.update(+id, updateCollaboratorDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.collaboratorsService.remove(+id);
  }
}
