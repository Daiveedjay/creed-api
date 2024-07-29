import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './announcements.dto';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) { }

  @UseGuards(AuthGuard)
  @Post('/:domainId')
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Param('domainId', ParseUUIDPipe) domainId: string, @CurrentUser('email') email: string) {
    return await this.announcementsService.create(email, domainId, createAnnouncementDto);
  }

  @Get('/:domainId')
  findAll(@Param('domainId', ParseUUIDPipe) domainId: string) {
    return this.announcementsService.findAll(domainId);
  }

  @Get('/:domainId/:announcementId')
  async findOne(@Param('domainId') domainId: string, @Param('announcementId') announcementId: string) {
    return await this.announcementsService.findOne(domainId, announcementId);
  }

  @UseGuards(AuthGuard)
  @Delete(':domainId/:announcementId')
  remove(@Param('domainId') domainId: string, @Param('announcementId') announcementId: string, @CurrentUser('email') email: string) {
    return this.announcementsService.deleteAnnouncements(domainId, announcementId, email);
  }
}
