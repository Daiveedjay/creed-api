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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  GoogleSignInDto,
  GoogleSignUpDto,
  PasswordResetDTO,
  UserSigninDTOType,
  UserSignupDTOType,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Request as ExpressRequest, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import CONSTANTS from 'src/lib/constants';
import { OAuth2Client } from 'google-auth-library';
import { admin } from 'src/lib/firebase';

@ApiTags('Auth')
@Controller('auth')
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
  @Post('google/login')
  public async googleLogin(
    @Body() dto: GoogleSignUpDto,
  ) {
    return this.authService.verifyAndUpdateUser(dto.accessToken, dto.deviceToken)
  }

  @Post('google/signup')
  public async googleSignUp(
    @Body() dto: GoogleSignUpDto,
  ) {
    return this.authService.verifyAndCreateUser(dto.accessToken, dto.deviceToken)
  }

}
