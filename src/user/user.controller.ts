/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserUpdateDTOType } from './user.dto';
import { AuthGuard, CurrentUser } from 'src/auth/auth.guard';
import { User } from './user.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieves the details of an existing user.
   * Provided the user is logged in this endpoint returns the corresponding user details.
   */
  @Get('/profile')
  @ApiSecurity('bearerAuth')
  public async getProfile(@User() user): Promise<any> {
    return await this.userService.getProfile(user.id);
  }

  /**
   * Updates the details of an existing user.
   * Provided the user is logged in this endpoint accepts primary values for change except email and password.
   */
  @Patch('/')
  @ApiSecurity('bearerAuth')
  public async editProfile(
    @CurrentUser('id') id: string,
    @Body() body: UserUpdateDTOType,
  ) {
    return await this.userService.editProfile(id, body);
  }
}
