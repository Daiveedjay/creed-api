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
import { DomainService } from './domain.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { CreateDomainDTO } from './domain.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Domains')
@Controller('domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) { }

  @Get()
  @UseGuards(AuthGuard)
  getDomains(@CurrentUser('id') id: string) {
    return this.domainService.getUserDomains(id);
  }

  @Get('/:domainID')
  @UseGuards(AuthGuard)
  async getDomain(
    @CurrentUser('id') id: string,
    @Param('domainID') domainID: string,
  ) {
    return await this.domainService.getUserDomain(id, domainID);
  }

  @Patch('/:domainID')
  @UseGuards(AuthGuard)
  async updateDomain(
    @CurrentUser('id') id: string,
    @Body() dto: CreateDomainDTO,
    @Param('domainID') domainID: string,
  ) {
    return await this.domainService.update(id, dto, domainID);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createDomain(
    @CurrentUser('id') id: string,
    @Body() dto: CreateDomainDTO,
  ) {
    return await this.domainService.create(id, dto);
  }

  @Delete('/:domainID')
  @UseGuards(AuthGuard)
  async leaveADomain(@Param('domainID') domainID: string, @CurrentUser('id') id: string) {
    return await this.domainService.leaveADomain(domainID, id);
  }

  @Delete('/:domainID')
  @UseGuards(AuthGuard)
  async deleteDomain(@Param('domainID') domainID: string, @CurrentUser('id') id: string) {
    return await this.domainService.deleteDomain(domainID, id);
  }
}
