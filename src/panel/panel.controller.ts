import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
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

  @Post("/:domainID")
  @UseGuards(AuthGuard)
  createPanel(@Param("domainID") domainID, @Body() dto: CreatePanelDTO) {
    return this.panelService.createPanel(domainID, dto);
  }

  @Patch("/:domainID/:panelID")
  @UseGuards(AuthGuard)
  editPanel(@Param("domainID") domainID, @Param("panelID") panelID, @Body() dto: CreatePanelDTO) {
    return this.panelService.editPanel(domainID, panelID, dto);
  }

  @Delete("/:domainID/:panelID")
  @UseGuards(AuthGuard)
  deletePanel(@Param("domainID") domainID, @Param("panelID") panelID) {
    return this.panelService.deletePanel(domainID, panelID);
  }
}
