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
import { UserPayload } from 'src/types';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DbService
  ) { }

  async getProfile(email: string) {
    const profile = await this.dbService.user.findUnique({
      where: { email },
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

    if (!profile) throw new NotFoundException('No profile like this');

    return {
      user_data: profile,
    }

  }

  async editProfile(userId: string, body: UserUpdateDTOType) {
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

  }

  async getProfileThroughEmail(email: string) {
    const profile = await this.dbService.user.findUnique({
      where: { email },
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

    if (!profile) throw new NotFoundException('No profile like this')

    return profile

  }
}
