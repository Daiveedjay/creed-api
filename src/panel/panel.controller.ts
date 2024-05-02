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
import { CreatePanelDTO } from './panel.dto';

@ApiTags('Panels')
@Controller('panels')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Get('/:domainID')
  @UseGuards(AuthGuard)
  async getPanels(@Param('domainID') domainID: string) {
    return await this.panelService.getPanels(domainID);
  }

  @Get('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async getPanel(@Param('domainID') domainID, @Param('panelID') panelID) {
    return await this.panelService.getPanel(domainID, panelID);
  }

  @Post('/:domainID')
  @UseGuards(AuthGuard)
  async createPanel(
    @Param('domainID') domainID,
    @CurrentUser('id') id: string,
    @Body() dto: CreatePanelDTO,
  ) {
    return await this.panelService.createPanel(domainID, id, dto);
  }

  @Patch('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async editPanel(
    @Param('domainID') domainID,
    @Param('panelID') panelID,
    @Body() dto: CreatePanelDTO,
  ) {
    return await this.panelService.editPanel(domainID, panelID, dto);
  }

  @Delete('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async deletePanel(@Param('domainID') domainID, @Param('panelID') panelID) {
    return await this.panelService.deletePanel(domainID, panelID);
  }
}
