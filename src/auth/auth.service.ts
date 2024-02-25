import { Injectable } from '@nestjs/common';
import {
  PasswordResetDTO,
  UserSigninDTOType,
  UserSignupDTOType,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor() {}

  async signUp(dto: UserSignupDTOType) {
    return 'signup';
  }

  async signIn(dto: UserSigninDTOType) {
    return 'signin';
  }

  async forgotPassword(email: string) {}

  async resetPassword(dto: PasswordResetDTO) {}

  async signGoogleLink(redirectURLi: string) {}

  async signInGoogle(redirectURLi: string, code: string) {}

  async signUpGoogle(
    dto: Record<string, any>,
    redirectURLi: string,
    code: string,
  ) {}
}
