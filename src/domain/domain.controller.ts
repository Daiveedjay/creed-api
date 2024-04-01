import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DomainService } from './domain.service';
import { User } from 'src/user/user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateDomainDTO, UpdateDefaultDomainDTO } from './domain.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Domain')
@Controller('domain')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  @UseGuards(AuthGuard)
  getDomains(@User() user) {
    return this.domainService.getUserDomains(user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  createDomain(@User() user, @Body() dto: CreateDomainDTO) {
    return this.domainService.create(user.id, dto);
  }
}
