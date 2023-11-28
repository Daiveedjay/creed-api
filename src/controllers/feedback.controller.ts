import { ContactUsDTO } from "@/schemas/feedback.schema";
import FeedbackService from "@/services/feedback.service";
import CONSTANTS from "@/utils/constants";
import BaseController from "@/utils/customBaseController";
import rateLimit from "express-rate-limit";
import { Body, Example, Middlewares, Post, Route, Tags } from "tsoa";
import { injectable } from "tsyringe";

const limiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMIT_FEEDBACK * 60 * 1000, // 1 minute
  max: 1, // 10 requests per minute
});

@injectable()
@Route("/api/feedback")
@Tags("Feedback")
export class FeedbackController extends BaseController {
  constructor(private feedbackService: FeedbackService) {
    super();
  }

  /**
   * Accepts message of users whether signed in or not.
   * And sends message admin email.
   */
  @Post("/message")
  @Middlewares(limiter)
  @Example<ContactUsDTO>({
    email: "john@example.com",
    message: "Hello I am John Doe...",
  })
  public async signUp(@Body() dto: ContactUsDTO): Promise<any> {
    return this.feedbackService.collectFeedback(dto);
  }
}
