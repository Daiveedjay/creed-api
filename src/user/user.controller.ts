import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserUpdateDTOType } from './user.dto';
import { AuthRequest } from 'src/types';
import { AuthGuard } from 'src/auth/auth.guard';
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
  @UseGuards(AuthGuard)
  public async getProfile(@User() user): Promise<any> {
    return this.userService.getProfile(user.id);
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
