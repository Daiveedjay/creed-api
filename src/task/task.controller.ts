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
import { CreateTaskDTO, DeleteMultipleTasksDto, UpdateMultipleTasksDto, UpdateTaskDto } from './task.dto';

@ApiTags('Tasks')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Get('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async getAllTasks(@Param('domainID', ParseUUIDPipe) domainID: string, @Param('panelID', ParseUUIDPipe) panelID: string) {
    return await this.taskService.getTasks(domainID, panelID);
  }

  @Get('/:domainID/:panelID/:taskID')
  @UseGuards(AuthGuard)
  async getParticularTask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @Param('taskID', ParseUUIDPipe) taskID: string,
  ) {
    return await this.taskService.getTask(domainID, panelID, taskID);
  }

  @Post('/:domainID/:panelID')
  @UseGuards(AuthGuard)
  async createATask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @CurrentUser('id') id: string,
    @Body() dto: CreateTaskDTO,
  ) {
    return await this.taskService.createTask(domainID, panelID, id, dto);
  }

  @Patch('/:domainID/:panelID/multiple-tasks')
  @UseGuards(AuthGuard)
  async updateMultipleTasks(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @CurrentUser('id') id: string,
    @Body() dto: UpdateMultipleTasksDto[],
  ) {
    return await this.taskService.editMultipleTasks(domainID, id, panelID, dto)
  }

  @Patch('/:domainID/:panelID/:taskID')
  @UseGuards(AuthGuard)
  async editATask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @Param('taskID', ParseUUIDPipe) taskID: string,
    @CurrentUser('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return await this.taskService.editTask(domainID, panelID, taskID, id, dto);
  }

  @Delete('/:domainID/:panelID/:taskID')
  @UseGuards(AuthGuard)
  async deleteATask(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @Param('taskID', ParseUUIDPipe) taskID: string,
    @CurrentUser('id') id: string,
  ) {
    return await this.taskService.deleteTask(domainID, taskID, panelID, id);
  }


  @Delete('/:domainID/:panelID/:statusID/tasks-in-column')
  @UseGuards(AuthGuard)
  async deleteALotOfTasksInASingleStatus(
    @Param('domainID', ParseUUIDPipe) domainID: string,
    @Param('panelID', ParseUUIDPipe) panelID: string,
    @Param('statusID', ParseUUIDPipe) statusID: string,
    @CurrentUser('id') id: string,
    @Body() dto: DeleteMultipleTasksDto,
  ) {
    return await this.taskService.deleteALotOfTasksInASingleStatus(domainID, id, panelID, statusID, dto);
  }

}
