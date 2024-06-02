/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { UserUpdateDTOType } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DbService
  ) {}

  async getProfile(userId: string) {
    try {
      const profile = await this.dbService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          fullName: true,
          username: true,
          jobTitle: true,
          department: true,
          location: true,
          language: true,
          availableHoursFrom: true,
          availableHoursTo: true,
          profilePicture: true,
          emailVerified: true,
        },
      });
  
      if(!profile) throw new NotFoundException('No profile like this')
  
      return profile
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async editProfile(userId: string, body: UserUpdateDTOType) {
    try {
      const currentUser = await this.dbService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!currentUser) throw new UnauthorizedException('No access');

      await this.dbService.user.update({
        where: {
          id: userId,
        },
        data: {
          username: body.username,
          location: body.location,
          language: body.language,
          jobTitle: body.jobTitle,
          fullName: body.fullName,
          department: body.department,
          availableHoursTo: body.availableHoursTo,
          availableHoursFrom: body.availableHoursFrom
        },
      });

      return new HttpException('Profile updated', HttpStatus.ACCEPTED);
    } catch (error) {
      throw new InternalServerErrorException('Profile info cannot be changed');
    }
  }
}
