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
import { DomainService } from './domain.service';
import { CurrentUser } from 'src/auth/auth.guard';
import { CreateDomainDTO } from './domain.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Domains')
@Controller('domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  getDomains(@CurrentUser('id') id: string) {
    return this.domainService.getUserDomains(id);
  }

  @Get('/:domainID')
  async getDomain(
    @CurrentUser('id') id: string,
    @Param('domainID') domainID: string,
  ) {
    return await this.domainService.getUserDomain(id, domainID);
  }

  @Patch('/:domainID')
  async updateDomain(
    @CurrentUser('id') id: string,
    @Body() dto: CreateDomainDTO,
    @Param('domainID') domainID: string,
  ) {
    return await this.domainService.update(id, dto, domainID);
  }

  @Post()
  async createDomain(
    @CurrentUser('id') id: string,
    @Body() dto: CreateDomainDTO,
  ) {
    return await this.domainService.create(id, dto);
  }

  @Delete('/:domainID')
  async deletePanel(@Param('domainID') domainID: string, @CurrentUser('id') id: string) {
    return await this.domainService.deleteDomain(domainID, id);
  }
}
