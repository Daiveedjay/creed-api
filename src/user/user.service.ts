import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { UserUpdateDTOType } from './user.dto';

@Injectable()
export class UserService {
  constructor(private readonly dbService: DbService) { }

  async getProfile(userId: string) {
    return this.dbService.user.findUnique({
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
  }

  async editProfile(userId: string, body: UserUpdateDTOType) { }
}
