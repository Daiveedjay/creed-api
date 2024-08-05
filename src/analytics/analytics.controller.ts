import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get(':domainId')
  @UseGuards(AuthGuard)
  async findOne(@Param('domainId') domainId: string, @CurrentUser('email') email: string) {
    return await this.analyticsService.getAnalyticsofDomain(domainId, email);
  }
}
