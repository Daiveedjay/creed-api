import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import BaseController from "@/utils/customBaseController";
import { StatusCodes } from "express-http-status";
import domainSchema, { DomainCreateDTO, DomainUpdateDTO } from "@/schemas/domain.schema";

@singleton()
export default class DomainService {
  constructor(private db: DbService, private controller: BaseController) {}

  async createDomain(uid: string, dto: DomainCreateDTO) {
    try {
      const domains = await this.db.domain.create({
        data: {
          name: dto.domainName,
          ownerId: uid
        }
      });
      return this.controller.sendResponse("Domain created", domains, StatusCodes.CREATED);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async getDomains(uid: string) {
    try {
      const domains = await this.db.domain.findMany({
        where: { ownerId: uid },
      });
      return this.controller.sendResponse("Domains", domains);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async getDomain(uid: string, domainId: string) {
    try {
      const domain = await this.db.domain.findFirst({
        where: { ownerId: uid, id: domainId },
      });
      return this.controller.sendResponse("Domain", domain);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async editDomain(uid: string, domainId: string, dto: DomainUpdateDTO) {
    try {
      const { domainName } = domainSchema.domainUpdateSchema.parse(dto);
      const domain = await this.db.domain.update({
        where: { ownerId: uid, id: domainId },
        data: {
          ...(dto.domainName && { name: domainName }),
        },
      });
      return this.controller.sendResponse("Domain updated", domain);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async deleteDomain(uid: string, domainId: string) {
    try {
      const domain = await this.db.domain.delete({
        where: { ownerId: uid, id: domainId },
      });
      return this.controller.sendResponse("Domain deleted", domain);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}
