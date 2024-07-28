import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get('/announcements/:domainID')
  @UseGuards(AuthGuard)
  findAll(@CurrentUser('email') email: string, @Param('domainID') domainID: string) {
    return this.notificationsService.getAllAnnouncementsNotifications(email, domainID);
  }

  @Get('/tasks/:domainID')
  @UseGuards(AuthGuard)
  findOne(@CurrentUser('email') email: string, @Param('domainID') domainID: string) {
    return this.notificationsService.getALlAssignedTasksNotifications(email, domainID);
  }
}
