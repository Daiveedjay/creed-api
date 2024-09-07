import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get('/announcements/:domainID')
  @UseGuards(AuthGuard)
  async getAllAnnouncementsNotifications(@CurrentUser('email') email: string, @Param('domainID') domainID: string) {
    return await this.notificationsService.getAllAnnouncementsNotifications(email, domainID);
  }

  @Get('/tasks/:domainID')
  @UseGuards(AuthGuard)
  async getALlAssignedTasksNotifications(@CurrentUser('email') email: string, @Param('domainID') domainID: string) {
    return await this.notificationsService.getALlAssignedTasksNotifications(email, domainID);
  }

  @Patch('/:notificationId')
  @UseGuards(AuthGuard)
  async announceMentIsRead(@Param('notificationId') notificationId: string) {
    return await this.notificationsService.announceMentIsRead(notificationId)
  }

  @Delete('/:notificationId')
  @UseGuards(AuthGuard)
  async announcementToBeDeleted(@Param('notificationId') notificationId: string, @CurrentUser('email') email: string) {
    return await this.notificationsService.announcementToBeDeleted(notificationId, email)
  }
}
