import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StatusService } from './status.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateStatusDTO } from './status.dto';

@ApiTags('Status')
@Controller('status/:domainID')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @UseGuards(AuthGuard)
  getPanels(@Param("domainID") domainID) {
    return this.statusService.getStatus(domainID);
  }

  @Post()
  @UseGuards(AuthGuard)
  createStatus(@Param("domainID") domainID, @Body() dto: CreateStatusDTO) {
    return this.statusService.createStatus(domainID, dto);
  }

  @Patch("/:statusID")
  @UseGuards(AuthGuard)
  editStatus(@Param("statusID") statusID, @Param("domainID") domainID, @Body() dto: CreateStatusDTO) {
    return this.statusService.editStatus(statusID, domainID, dto);
  }

  @Delete("/:statusID")
  @UseGuards(AuthGuard)
  deleteStatus(@Param("domainID") domainID, @Param("statusID") statusID) {
    return this.statusService.deleteStatus(statusID, domainID);
  }
}
