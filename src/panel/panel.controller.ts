/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { PanelService } from './panel.service';
import { ApiTags } from '@nestjs/swagger';
import { AddUsersDto, CreatePanelDTO, DeleteUserDto } from './panel.dto';

@ApiTags('Panels')
@Controller('panels')
export class PanelController {
  constructor(private readonly panelService: PanelService) { }

  @Get('/:domainID')
  @UseGuards(AuthGuard)
  async getPanels(@Param('domainID') domainID: string, @CurrentUser('id') id: string) {
    return await this.panelService.getPanels(domainID, id);
  }

  @Post('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async addCollaboratorsToPanel(@Body() addUsersDto: AddUsersDto, @Param('domainID') domainID: string, @Param('panelID') panelID: string, @CurrentUser('id') id: string,) {
    return await this.panelService.addUsersToPanel(domainID, panelID, id, addUsersDto)
  }

  @Delete(':domainID/:panelID/remove-users')
  @UseGuards(AuthGuard)
  async removeCollaboratorsFromPanel(@Body() deleteUserDto: DeleteUserDto, @Param('domainID') domainID: string, @Param('panelID') panelID: string, @CurrentUser('id') id: string) {
    return await this.panelService.removeAUserFromPanel(domainID, panelID, id, deleteUserDto)
  }

  @Get('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async getPanel(@Param('domainID') domainID: string, @Param('panelID') panelID: string, @CurrentUser('id') id: string) {
    return await this.panelService.getPanel(domainID, panelID, id);
  }

  @Post('/:domainID')
  @UseGuards(AuthGuard)
  async createPanel(
    @Param('domainID') domainID: string,
    @CurrentUser('id') id: string,
    @Body() dto: CreatePanelDTO,
  ) {
    return await this.panelService.createPanel(domainID, id, dto);
  }

  @Patch('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async editPanel(
    @Param('domainID') domainID: string,
    @Param('panelID') panelID: string,
    @Body() dto: CreatePanelDTO,
  ) {
    return await this.panelService.editPanel(domainID, panelID, dto);
  }

  @Delete('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async deletePanel(@Param('domainID') domainID: string, @Param('panelID') panelID: string) {
    return await this.panelService.deletePanel(domainID, panelID);
  }
}
