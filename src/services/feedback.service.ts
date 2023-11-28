import BaseController from "@/utils/customBaseController";
import { ContactUsDTO } from "@/schemas/feedback.schema";
import { singleton } from "tsyringe";
import { StatusCodes } from "express-http-status";

@singleton()
export default class FeedbackService {
  constructor(private controller: BaseController) {}

  async collectFeedback(dto: ContactUsDTO) {
    try {
      // Store feedback or send to company email
      // Send response email
      return this.controller.sendResponse("Message received", dto);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}
