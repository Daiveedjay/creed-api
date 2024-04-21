import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StatusService } from './status.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateStatusDTO } from './status.dto';

@ApiTags('Status')
@Controller('status/:panelID')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @UseGuards(AuthGuard)
  getPanels(@Param("panelID") panelID) {
    return this.statusService.getStatus(panelID);
  }

  @Post()
  @UseGuards(AuthGuard)
  createStatus(@Param("panelID") panelID, @Body() dto: CreateStatusDTO) {
    return this.statusService.createStatus(panelID, dto);
  }

  @Patch("/:statusID")
  @UseGuards(AuthGuard)
  editStatus(@Param("statusID") statusID, @Param("panelID") panelID, @Body() dto: CreateStatusDTO) {
    return this.statusService.editStatus(statusID, panelID, dto);
  }

  @Delete("/:statusID")
  @UseGuards(AuthGuard)
  deleteStatus(@Param("panelID") panelID, @Param("statusID") statusID) {
    return this.statusService.deleteStatus(statusID, panelID);
  }
}
