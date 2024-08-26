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
import { AWSService } from 'src/utils/aws.service';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DbService,
    private readonly awsService: AWSService
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

  async editProfile(email: string, body: UserUpdateDTOType) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        email
      },
    });

    if (!currentUser) throw new UnauthorizedException('No access');

    if (body.profilePicture) {
      if (currentUser.profilePictureKey && currentUser.profilePicture) {
        const deleteUrlFromAWS = await this.awsService.deleteFile(currentUser.id)

        if (deleteUrlFromAWS.success === true) {
          const picture = await this.awsService.uploadFile(body.profilePicture, currentUser.id)
          if (picture.success === true) {
            await this.dbService.user.update({
              where: {
                email
              },
              data: {
                username: body.username,
                location: body.location,
                language: body.language,
                profilePicture: picture.url,
                profilePictureKey: picture.key,
                jobTitle: body.jobTitle,
                fullName: body.fullName,
                department: body.department,
                availableHoursTo: body.availableHoursTo,
                availableHoursFrom: body.availableHoursFrom
              },
            });

            return new HttpException('Profile updated', HttpStatus.ACCEPTED);
          } else {
            throw new InternalServerErrorException(picture.url)
          }
        } else {
          throw new InternalServerErrorException(deleteUrlFromAWS.message)
        }
      } else {
        const picture = await this.awsService.uploadFile(body.profilePicture, currentUser.id)
        if (picture.success === true) {
          await this.dbService.user.update({
            where: {
              email
            },
            data: {
              username: body.username,
              location: body.location,
              language: body.language,
              profilePicture: picture.url,
              profilePictureKey: picture.key,
              jobTitle: body.jobTitle,
              fullName: body.fullName,
              department: body.department,
              availableHoursTo: body.availableHoursTo,
              availableHoursFrom: body.availableHoursFrom
            },
          });

          return new HttpException('Profile updated', HttpStatus.ACCEPTED);
        } else {
          throw new InternalServerErrorException(picture.url)
        }

      }
    } else {
      await this.dbService.user.update({
        where: {
          email
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
