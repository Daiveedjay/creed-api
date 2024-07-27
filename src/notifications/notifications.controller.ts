import { Controller, Get, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get('/announcements')
  @UseGuards(AuthGuard)
  findAll(@CurrentUser('email') email: string) {
    return this.notificationsService.getAllAnnouncementsNotifications(email);
  }

  @Get('/tasks')
  @UseGuards(AuthGuard)
  findOne(@CurrentUser('email') email: string) {
    return this.notificationsService.getALlAssignedTasksNotifications(email);
  }
}
