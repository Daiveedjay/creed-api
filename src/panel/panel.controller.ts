import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/user/user.decorator';
import { DbService } from 'src/utils/db.service';
import { PanelService } from './panel.service';

@Controller('panels')
export class PanelController {
  constructor(private readonly dbService: DbService, private readonly panelService: PanelService) {}

  @Get()
  @UseGuards(AuthGuard)
  getPanels(@Param("domainID") domainID) {
    return this.panelService.getPanels(domainID);
  }

  @Post()
  @UseGuards(AuthGuard)
  createPanel(@Param("domainID") domainID) {
    return this.panelService.createPanel(domainID);
  }
}
