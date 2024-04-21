import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreatePanelDTO } from 'src/panel/panel.dto';

@ApiTags('Tasks')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Get("/:panelID")
  @UseGuards(AuthGuard)
  getPanels(@Param("panelID") panelID) {
    return this.taskService.getTasks(panelID);
  }

  @Get("/:domainID/:panelID")
  @UseGuards(AuthGuard)
  getPanel(@Param("domainID") domainID, @Param("panelID") panelID) {
    return this.taskService.getTask(domainID, panelID);
  }

  @Post("/:domainID")
  @UseGuards(AuthGuard)
  createPanel(@Param("domainID") domainID, @Body() dto: CreatePanelDTO) {
    return this.taskService.createTask(domainID, dto);
  }

  @Patch("/:domainID/:panelID")
  @UseGuards(AuthGuard)
  editPanel(@Param("domainID") domainID, @Param("panelID") panelID, @Body() dto: CreatePanelDTO) {
    return this.taskService.editTask(domainID, panelID, dto);
  }

  @Delete("/:domainID/:panelID")
  @UseGuards(AuthGuard)
  deletePanel(@Param("domainID") domainID, @Param("panelID") panelID) {
    return this.taskService.deleteTask(domainID, panelID);
  }
}
