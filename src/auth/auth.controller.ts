/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  PasswordResetDTO,
  UserSigninDTOType,
  UserSignupDTOType,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Request as ExpressRequest, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import CONSTANTS from 'src/lib/constants';
import { OAuth2Client } from 'google-auth-library';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  /**
   * Endpoint to signup user
   */
  @Post('signup')
  async signUp(@Body() dto: UserSignupDTOType): Promise<any> {
    return this.authService.signUp(dto);
  }

  /**
   * Endpoint to collect auth details and issue auth tokens if correct.
   */
  @Post('signin')
  public async signIn(@Body() dto: UserSigninDTOType): Promise<any> {
    return this.authService.signIn(dto);
  }

  /**
   * Generates and send an OTP to user email if a user with the specified email exists
   * @param email Email address of account for password reset
   */
  @Get('forgot-password')
  public async forgotPassword(@Query('email') email?: string): Promise<any> {
    return this.authService.forgotPassword(email || '');
  }

  /**
   * Accepts new password and OTP sent to email for password reset process
   * @param otp A six (6) character long text sent to user email
   * @param password New password to be used by account
   */
  @Post('reset-password')
  public async resetPassword(@Body() dto: PasswordResetDTO): Promise<any> {
    return this.authService.resetPassword(dto);
  }

  /**
   * Retrieves a google signin link for google signin or signup processes
   * @param redirectURL (Optional) url google should redirect the user to after the google auth screen
   */
  @Get('sign-google-link')
  public async signGoogleLink(
    @Res() res: Response
  ): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = 'http://localhost:3000/api/auth/google/callback'; // Your backend endpoint
    const scope = 'profile email';
    const responseType = 'code';
    const state = 'random_state_string'; // Optional, used for CSRF protection

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}`;

    //return googleAuthUrl;
    return res.redirect(googleAuthUrl)
  }

  /**
   * Uses successful google auth screen parameters to signin a new user
   * @param code
   * @param redirectURL
   */
  @Post('signin-google')
  public async signInGoogle(
    @Req() req: ExpressRequest,
    @Query('code') code: string,
    @Query('redirectURL') redirectURL: string,
  ) {
    const redirectURLi =
      (redirectURL as string) ||
      `${req.protocol}://${req.get('host')}/api/auth/signup-google`;
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
  @Post('/signup-google')
  public async signUpGoogle(@Req() req: ExpressRequest) {
    console.log(req.query.code)
    const redirectURL =
      (req.query.redirectURL as string) ||
      `${req.protocol}://${req.get('host')}/api/auth/signup-google`;
    return this.authService.signUpGoogle(
      req.body,
      redirectURL,
      req.query.code as string,
    );
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const data = await this.authService.googleCallback(code)
    return data
  }
}
