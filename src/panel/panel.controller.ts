import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/user/user.decorator';
import { DbService } from 'src/utils/db.service';
import { PanelService } from './panel.service';
import { ApiTags } from '@nestjs/swagger';
import { CreatePanelDTO } from './panel.dto';

@ApiTags('Panels')
@Controller('panels')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Get("/:domainID")
  @UseGuards(AuthGuard)
  getPanels(@Param("domainID") domainID) {
    return this.panelService.getPanels(domainID);
  }

  @Get("/:domainID/:panelID")
  @UseGuards(AuthGuard)
  getPanel(@Param("domainID") domainID, @Param("panelID") panelID) {
    return this.panelService.getPanel(domainID, panelID);
  }

  @Post()
  @UseGuards(AuthGuard)
  createPanel(@Param("domainID") domainID, @Body() dto: CreatePanelDTO) {
    return this.panelService.createPanel(domainID, dto);
  }

  @Delete()
  @UseGuards(AuthGuard)
  deletePanel(@Param("domainID") domainID, @Param("panelID") panelID) {
    return this.panelService.deletePanel(domainID, panelID);
  }
}
