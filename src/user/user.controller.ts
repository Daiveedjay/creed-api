import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserUpdateDTOType } from './user.dto';
import { AuthRequest } from 'src/types';

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
  public async getProfile(@Req() req: AuthRequest): Promise<any> {
    return this.userService.getProfile(req.auth?.uid as string);
  }

  /**
   * Updates the details of an existing user.
   * Provided the user is logged in this endpoint accepts primary values for change except email and password.
   */
  @Put('/')
  @ApiSecurity('bearerAuth')
  public async editProfile(
    @Req() req: AuthRequest,
    @Body() body: UserUpdateDTOType,
  ) {
    return this.userService.editProfile(req.auth?.uid as string, body);
  }
}
