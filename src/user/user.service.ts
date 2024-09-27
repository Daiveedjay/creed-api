/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/utils/db.service';
import { UserUpdateDTOType, VerifyEmailDto } from './user.dto';
import { AWSService } from 'src/utils/aws.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/utils/email.service';
import { Format, getEmailSubject, getEmailTemplate } from 'src/utils/email-template';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
    private readonly awsService: AWSService,
    private readonly emailService: EmailService
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

    // }
    const updatedProfile = await this.dbService.user.update({
      where: {
        email
      },
      data: {
        username: body.username,
        location: body.location,
        jobTitle: body.jobTitle,
        fullName: body.fullName,
        department: body.department,
        availableHoursTo: body.availableHoursTo,
        availableHoursFrom: body.availableHoursFrom
      },
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
        availableHoursFrom: true,
        availableHoursTo: true,
        profilePicture: true,
        emailVerified: true,
      }
    });

    return updatedProfile;
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
        availableHoursFrom: true,
        availableHoursTo: true,
        profilePicture: true,
        emailVerified: true,
      },
    });

    if (!profile) throw new NotFoundException('No profile like this')

    return profile

  }

  async updateProfilePicture(email: string, profilePicture: Express.Multer.File) {
    const currentUser = await this.dbService.user.findUnique({
      where: {
        email
      }
    })

    if (!currentUser) {
      throw new MethodNotAllowedException('You lost?');
    };

    if (currentUser.profilePictureKey !== null && currentUser.profilePicture !== null) {
      const deleteUrlFromAWS = await this.awsService.deleteFile(currentUser.id)

      if (deleteUrlFromAWS.success === true) {
        const picture = await this.awsService.uploadFile(profilePicture)
        if (picture.success === true) {
          await this.dbService.user.update({
            where: {
              email
            },
            data: {
              profilePicture: picture.url,
              profilePictureKey: picture.key,
            },
          });

          return picture.url
        } else {
          throw new InternalServerErrorException(picture.url)
        }
      } else {
        throw new InternalServerErrorException(deleteUrlFromAWS.message)
      }
    } else {
      const picture = await this.awsService.uploadFile(profilePicture)
      if (picture.success === true) {
        await this.dbService.user.update({
          where: {
            email
          },
          data: {
            profilePicture: picture.url,
            profilePictureKey: picture.key,
          },
        });

        return picture.url
      } else {
        throw new InternalServerErrorException(picture.url)
      }
    }

  }

  async sendVerificationEmailLink(email: string) {
    const user = await this.getProfile(email)

    if (!user) {
      throw new MethodNotAllowedException('No user is found!')
    } else if (user.user_data.emailVerified === true) {
      throw new MethodNotAllowedException('You are already verified!')
    }

    const hashedPayload = new JwtService().sign(email, {
      secret: this.configService.get('JWT_SECRET'),
    });

    const subject = getEmailSubject(Format.VERIFYING_EMAIL, {})
    const firstName = user.user_data.fullName.split(' ')
    const body = getEmailTemplate(Format.VERIFYING_EMAIL, firstName[0], {
      verifyEmailLink: `https://app.kreed.tech/email_verify?payload=${hashedPayload}`
    })
    await this.emailService.sendEmail(email, subject, body);
  }

  async verifyEmail(body: VerifyEmailDto) {
    const user = await this.getProfile(body.email)

    if (!user) {
      throw new MethodNotAllowedException('No user is found!')
    } else if (user.user_data.emailVerified === true) {
      throw new MethodNotAllowedException('You are already verified!')
    }

    await this.dbService.user.update({
      where: {
        email: body.email
      },
      data: {
        emailVerified: true
      }
    })

    return new HttpException('Email verified!', HttpStatus.OK)
  }
}
