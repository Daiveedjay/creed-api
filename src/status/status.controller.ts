/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StatusService } from './status.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateStatusDTO } from './status.dto';

@ApiTags('Status')
@Controller('status/:domainID')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  async getStatusAssociatedWithDomain(@Param('domainID') domainID: string) {
    return await this.statusService.getStatus(domainID);
  }

  @Post()
  async createStatus(@Param('domainID') domainID, @Body() dto: CreateStatusDTO) {
    return await this.statusService.createStatus(domainID, dto);
  }

  @Patch('/:statusID')
  async editStatus(
    @Param('statusID') statusID,
    @Param('domainID') domainID,
    @Body() dto: CreateStatusDTO,
  ) {
    return await this.statusService.editStatus(statusID, domainID, dto);
  }

  @Delete('/:statusID')
  async deleteStatus(@Param('domainID') domainID, @Param('statusID') statusID) {
    return await this.statusService.deleteStatus(statusID, domainID);
  }
}
