/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { CreateTaskDTO, UpdateTaskDto } from './task.dto';

@ApiTags('Tasks')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  getAllTasks(@Param('panelID', ParseUUIDPipe) panelID: string, @Param('domainID', ParseUUIDPipe) domainID: string) {
    return this.taskService.getTasks(domainID, panelID);
  }

  @Get('/:domainID/:panelID/:taskID')
  @UseGuards(AuthGuard)
  getParticularTask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @Param('taskID') taskID: string,
  ) {
    return this.taskService.getTask(domainID, panelID, taskID);
  }

  @Post('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  createATask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @CurrentUser('id') id: string,
    @Body() dto: CreateTaskDTO,
  ) {
    return this.taskService.createTask(domainID, panelID, id, dto);
  }

  @Patch('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  editATask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.editTask(domainID, panelID, dto);
  }

  @Delete('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  deleteATask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
  ) {
    return this.taskService.deleteTask(domainID, panelID);
  }
}
