import { ObjType } from "@/types/util.types";
import { Controller } from "tsoa";
import { StatusCodes } from "express-http-status";

export default class BaseController extends Controller {

  public createError(statusCode: number, message: string, errors: ObjType | null = null) {
    this.setStatus(statusCode)
    return {
      success: false,
      message,
      errors
    }
  }

  public sendResponse(message: string, data: any = null, statusCode: number = StatusCodes.OK) {
    this.setStatus(statusCode);
    return {
      success: statusCode >= StatusCodes.OK && statusCode < StatusCodes.MULTIPLE_CHOICES,
      message,
      data
    }
  }
}