import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import { StatusCreateDTO, StatusEditDTO } from "@/schemas/status.schema";

@singleton()
export default class StatusService {
  constructor(private db: DbService) {}

  async createStatus(uid: string, dto: StatusCreateDTO) {}
  async getStatus(uid: string) {}
  async editStatus(uid: string, statusId: string, dto: StatusEditDTO) {}
  async deleteStatus(uid: string, statusId: string) {}
}
