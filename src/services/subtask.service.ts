import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import { SubtaskCreateDTO, SubtaskEditDTO } from "@/schemas/subtask.schema";

@singleton()
export default class StatusService {
  constructor(private db: DbService) {}

  async createSubtask(uid: string, dto: SubtaskCreateDTO) {}
  async getSubtask(uid: string) {}
  async editSubtask(uid: string, statusId: string, dto: SubtaskEditDTO) {}
  async deleteSubtask(uid: string, statusId: string) {}
}
