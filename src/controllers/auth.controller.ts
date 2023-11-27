import { ObjType } from "@/types/util.types";
import {
  Body,
  Controller,
  Example,
  Get,
  Post,
  Query,
  Request,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import AuthService from "@/services/auth.service";
import Express from "express";
import { injectable } from "tsyringe";
import CONSTANTS from "@/utils/constants";
import { PasswordResetDTO, UserSigninDTOType, UserSignupDTOType } from "@/schemas/auth.schema";
import BaseController from "@/utils/customBaseController";

@injectable()
@Route("/api/auth")
@Tags("Auth")
export class Authcontroller extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * Retrieves the details of an existing user.
   * Provided the user is logged in this endpoint returns the corresponding user details.
   */
  @Post("/signup")
  @SuccessResponse("201", "Created")
  @Example<UserSignupDTOType>({
    email: "john@example.com",
    password: "My_$3cure_p1n",
    fullName: "John Doe",
    domainName: "JohnDoe",
  })
  public async signUp(@Body() dto: UserSignupDTOType): Promise<any> {
    return this.authService.signUp(this, dto);
  }

  /**
   * Endpoint to collect auth details and issue auth tokens if correct.
   */
  @Post("signin")
  @Example<UserSigninDTOType>({
    email: "john@example.com",
    password: "My_$3cure_p1n",
  })
  public async signIn(@Body() dto: UserSigninDTOType): Promise<any> {
    return this.authService.signIn(this, dto);
  }

  /**
   * Generates and send an OTP to user email if a user with the specified email exists
   * @param email Email address of account for password reset
   */
  @Get("forgot-password")
  public async forgotPassword(@Query("email") email?: string): Promise<any> {
    return this.authService.forgotPassword(this, email || "");
  }

  /**
   * Accepts new password and OTP sent to email for password reset process
   * @param otp A six (6) character long text sent to user email
   * @param password New password to be used by account
   */
  @Post("reset-password")
  public async resetPassword(@Body() dto: PasswordResetDTO): Promise<any> {
    return this.authService.resetPassword(this, dto);
  }

  /**
   * Retrieves a google signin link for google signin or signup processes
   * @param redirectURL (Optional) url google should redirect the user to after the google auth screen
   */
  @Get("sign-google-link")
  public async signGoogleLink(
    @Request() req: Express.Request,
    @Query("redirectURL") redirectURL?: string
  ): Promise<any> {
    this.setHeader("Access-Control-Allow-Origin", CONSTANTS.CLIENT_APP_URL);
    this.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    const redirectURLi =
      redirectURL ||
      `${req.protocol}://${req.get("host")}/api/auth/signup-google`;

    return this.authService.signGoogleLink(redirectURLi);
  }

  /**
   * Uses successfull google auth screen parameters to signin a new user
   * @param code
   * @param redirectURL
   */
  @Post("signin-google")
  public async signInGoogle(
    @Request() req: Express.Request,
    @Query("code") code: string,
    @Query("redirectURL") redirectURL: string
  ) {
    const redirectURLi =
      (redirectURL as string) ||
      `${req.protocol}://${req.get("host")}/api/auth/signup-google`;
    return this.authService.signInGoogle(redirectURLi, code);
  }

  /**
   * Uses successfull google auth screen parameters to signup a new user
   * @param code
   * @param redirectURL
   * @example {
   *  "domainName": "My domain name"
   * }
   */
  @SuccessResponse("201", "Created")
  @Post("/signup-google")
  public async signUpGoogle(@Request() req: Express.Request) {
    const redirectURL =
      (req.query.redirectURL as string) ||
      `${req.protocol}://${req.get("host")}/api/auth/signup-google`;
    return this.authService.signUpGoogle(
      this,
      req.body,
      redirectURL,
      req.query.code as string
    );
  }
}
