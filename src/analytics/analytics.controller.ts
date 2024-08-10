import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get(':domainId')
  @ApiSecurity('bearerAuth')
  @UseGuards(AuthGuard)
  async getAnalyticsofDomain(@Param('domainId') domainId: string, @CurrentUser('email') email: string) {
    return await this.analyticsService.getAnalyticsofDomain(domainId, email);
  }

  @Get(':domainId/average-time')
  @ApiSecurity('bearerAuth')
  @UseGuards(AuthGuard)
  async getAverageTimeInADomain(@Param('domainId') domainId: string, @CurrentUser('email') email: string) {
    return await this.analyticsService.getAverageTiemToCompleteATask(domainId, email)
  }
}
