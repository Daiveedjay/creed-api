import { DomainCreateDTO, DomainUpdateDTO } from "@/schemas/domain.schema";
import DomainService from "@/services/domain.service";
import { AuthRequest } from "@/types/auth.types";
import BaseController from "@/utils/customBaseController";
import { Body, Delete, Get, Patch, Post, Request, Route, Security, Tags } from "tsoa";
import { injectable } from "tsyringe";


@injectable()
@Route("/api/domains")
@Tags("Domains")
export class DomainController extends BaseController {
  constructor(private domainService: DomainService) {
    super();
  }

  /**
   * Create a domain
   */
  @Post("/")
  @Security("bearerAuth")
  public async createDomain(@Request() req: AuthRequest, @Body() dto: DomainCreateDTO): Promise<any> {
    return this.domainService.createDomain(req.auth?.uid as string, dto);
  }

  /**
   * Retrieves list of domains belonging to a user
   */
  @Get("/")
  @Security("bearerAuth")
  public async getDomains(@Request() req: AuthRequest): Promise<any> {
    return this.domainService.getDomains(req.auth?.uid as string);
  }

  /**
   * Retrieves a domain belonging to a user
   */
  @Get("{domainId}")
  @Security("bearerAuth")
  public async getDomain(domainId: string, @Request() req: AuthRequest): Promise<any> {
    return this.domainService.getDomain(req.auth?.uid as string, domainId);
  }

  /**
   * Edit a domain belonging to a user
   */
  @Patch("{domainId}")
  @Security("bearerAuth")
  public async editDomain(domainId: string, @Request() req: AuthRequest, @Body() dto: DomainUpdateDTO): Promise<any> {
    return this.domainService.editDomain(req.auth?.uid as string, domainId, dto);
  }

  /**
   * Delete a domain belonging to a user
   */
  @Delete("{domainId}")
  @Security("bearerAuth")
  public async deleteDomain(domainId: string, @Request() req: AuthRequest): Promise<any> {
    return this.domainService.deleteDomain(req.auth?.uid as string, domainId);
  }
}