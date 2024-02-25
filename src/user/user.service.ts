import { Injectable } from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { UserUpdateDTOType } from './user.dto';

@Injectable()
export class UserService {
  constructor(private readonly dbService: DbService) {}

  async getProfile(userId: string) {}

  async editProfile(userId: string, body: UserUpdateDTOType) {}
}
