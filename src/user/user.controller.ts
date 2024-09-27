/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Patch, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserUpdateDTOType, VerifyEmailDto } from './user.dto';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * Retrieves the details of an existing user.
   * Provided the user is logged in this endpoint returns the corresponding user details.
   */
  @Get('/profile')
  @ApiSecurity('bearerAuth')
  @UseGuards(AuthGuard)
  public async getProfile(@CurrentUser('email') email: string): Promise<any> {
    return await this.userService.getProfile(email);
  }

  /**
   * Updates the details of an existing user.
   * Provided the user is logged in this endpoint accepts primary values for change except email and password.
   */
  @Patch('/')
  @ApiSecurity('bearerAuth')
  @UseGuards(AuthGuard)
  public async editProfile(
    @CurrentUser('email') email: string,
    @Body() body: UserUpdateDTOType,
  ) {
    return await this.userService.editProfile(email, body);
  }

  @Patch('/upload')
  @ApiSecurity('bearerAuth')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profilePicture'))
  public async uploadFile(@UploadedFile() profilePicture: Express.Multer.File, @CurrentUser('email') email: string) {
    return await this.userService.updateProfilePicture(email, profilePicture)
  }

  @Patch('/verify-email')
  public async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.userService.verifyEmail(dto)
  }
}
