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
import { StatusService } from './status.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateStatusDTO } from './status.dto';

@ApiTags('Status')
@Controller('status/:domainID')
export class StatusController {
  constructor(private readonly statusService: StatusService) { }

  @Get()
  @UseGuards(AuthGuard)
  async getStatusAssociatedWithDomain(@Param('domainID') domainID: string) {
    return await this.statusService.getStatus(domainID);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createStatus(@Param('domainID') domainID: string, @Body() dto: CreateStatusDTO) {
    return await this.statusService.createStatus(domainID, dto);
  }

  @Post('/multiple-status')
  @UseGuards(AuthGuard)
  async createMultipleStatus(@Param('domainID') domainID: string, @Body() dto: CreateStatusDTO[]) {
    return await this.statusService.createMultipleStatus(domainID, dto);
  }


  @Patch('/:statusID')
  @UseGuards(AuthGuard)
  async editStatus(
    @Param('statusID') statusID: string,
    @Param('domainID') domainID: string,
    @Body() dto: CreateStatusDTO,
  ) {
    return await this.statusService.editStatus(statusID, domainID, dto);
  }

  @Delete('/:statusID')
  @UseGuards(AuthGuard)
  async deleteStatus(@Param('domainID') domainID: string, @Param('statusID') statusID: string) {
    return await this.statusService.deleteStatus(statusID, domainID);
  }
}
