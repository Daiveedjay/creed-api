import { StatusCreateDTO, StatusEditDTO } from "@/schemas/status.schema";
import StatusService from "@/services/status.service";
import { AuthRequest } from "@/types/auth.types";
import BaseController from "@/utils/customBaseController";
import { Body, Delete, Get, Patch, Post, Request, Route, Security, Tags } from "tsoa";
import { injectable } from "tsyringe";


@injectable()
@Route("/api/status")
@Tags("SubTask")
export class SubtaskController extends BaseController {
  constructor(private statusService: StatusService) {
    super();
  }

  // /**
  //  * Create a subtask
  //  */
  // @Post("/")
  // @Security("bearerAuth")
  // public async createSubtask(@Request() req: AuthRequest, @Body() dto: StatusCreateDTO): Promise<any> {
  //   return this.statusService.createStatus(req.auth?.uid as string, dto);
  // }

  // /**
  //  * Retrieves list of status belonging to a subtask
  //  */
  // @Get("/")
  // @Security("bearerAuth")
  // public async readStatus(@Request() req: AuthRequest): Promise<any> {
  //   return this.statusService.getStatus(req.auth?.uid as string);
  // }

  // /**
  //  * Edit a subtask belonging to a task
  //  */
  // @Patch("{taskId}")
  // @Security("bearerAuth")
  // public async editStatus(taskId: string, @Request() req: AuthRequest, @Body() dto: StatusEditDTO): Promise<any> {
  //   return this.statusService.editStatus(req.auth?.uid as string, taskId, dto);
  // }

  // /**
  //  * Delete a domain belonging to a user
  //  */
  // @Delete("{taskId}")
  // @Security("bearerAuth")
  // public async deleteDomain(taskId: string, @Request() req: AuthRequest): Promise<any> {
  //   return this.statusService.deleteStatus(req.auth?.uid as string, taskId);
  // }
}