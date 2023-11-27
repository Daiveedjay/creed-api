import { UserUpdateDTOType } from "@/schemas/user.schema";
import UserService from "@/services/user.service";
import { AuthRequest } from "@/types/auth.types";
import {
  Put,
  Route,
  Get,
  Controller,
  Tags,
  Request,
  Security,
  Body,
  Example,
} from "tsoa";
import { injectable } from "tsyringe";

@injectable()
@Route("/api/user")
@Tags("User")
export class UserController extends Controller {
  constructor(private userService: UserService) {
    super();
  }

  /**
   * Retrieves the details of an existing user.
   * Provided the user is logged in this endpoint returns the corresponding user details.
   */
  @Get("/profile")
  @Security("bearerAuth")
  public async getProfile(@Request() req: AuthRequest): Promise<any> {
    return this.userService.getProfile(req.auth?.uid as string);
  }

  /**
   * Updates the details of an existing user.
   * Provided the user is logged in this endpoint accepts primary values for change except email and password.
   */
  @Put("/")
  @Security("bearerAuth")
  @Example<UserUpdateDTOType>({
    fullName: "John Doe",
    domainName: "JohnDoe",
  })
  public async editProfile(
    @Request() req: AuthRequest,
    @Body() body: UserUpdateDTOType
  ) {
    return this.userService.editProfile(req.auth?.uid as string, body);
  }
}

