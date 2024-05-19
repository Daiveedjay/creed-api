/* eslint-disable prettier/prettier */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  PasswordResetDTO,
  UserSigninDTOType,
  UserSignupDTOType,
} from './auth.dto';
import { DbService } from 'src/utils/db.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OTPReason, Roles } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { EmailService } from 'src/utils/email.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
  ) { }

  async signUp(dto: UserSignupDTOType) {
    try {
      const firstName = dto.fullName.split(' ')
      const oldUser = await this.dbService.user.findUnique({
        where: { email: dto.email },
      });

      if (oldUser) {
        throw new ForbiddenException('A user with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      await this.emailService.sendWelcomeEmail(dto.email, firstName[0])

      const user = await this.dbService.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          fullName: dto.fullName,
        },
      });

      // Setup default domain
      const newDomain = await this.dbService.domain.create({
        data: {
          name: dto.domainName,
          ownerId: user.id,

          domainMembers: {
            create: {
              memberRole: Roles.owner,
              userId: user.id
            }
          }
        },
        include: {
          panels: true,
          status: true,
        }
      });

      // TODO: Send welcome email

      const token = this.jwtService.sign(
        { uid: user.id },
        {
          expiresIn: '24h',
        },
      );

      const userObj = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        jobTitle: user.jobTitle,
        department: user.department,
        location: user.location,
        language: user.language,
        availableHoursFrom: user.availableHoursFrom,
        availableHoursTo: user.availableHoursTo,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
      };

      return {
        message: 'Signup successful',
        access_token: token,
        user_data: userObj,
        domains: newDomain,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async signIn(dto: UserSigninDTOType) {
    try {
      const user = await this.dbService.user.findUnique({
        where: { email: dto.email },
        include: {
          domainMembership: {
            select: {
              domain: {
                include: {
                  panels: true,
                  status: true,
                }
              },
  
            }
          },
        }
      });
  
      if (!user) {
        throw new ForbiddenException('Invalid credentials');
      }
  
      const passwordMatch = await bcrypt.compare(dto.password, user.password);
  
      if (!passwordMatch) {
        throw new ForbiddenException('Invalid credentials');
      }
  
      // TODO: Send signin email
  
      const token = this.jwtService.sign(
        { uid: user.id },
        {
          expiresIn: '24h',
        },
      );
  
      const userObj = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        jobTitle: user.jobTitle,
        department: user.department,
        location: user.location,
        language: user.language,
        availableHoursFrom: user.availableHoursFrom,
        availableHoursTo: user.availableHoursTo,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
      };
  
      const domainMembership = user.domainMembership.map(membership => ({ ...membership.domain }));
  
      return {
        message: 'Access Token',
        access_token: token,
        user_data: userObj,
        domains: domainMembership,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.dbService.user.findUnique({ where: { email } });

      if (!user) {
        throw new ForbiddenException("User with this email doesn't exist");
      }
      // generate new OTP
      const otp = crypto
        .randomUUID()
        .slice(0, this.configService.get('OTP_LENGTH'));
      await this.dbService.user.update({
        where: { email },
        data: {
          otp,
          otpLastModifiedAt: new Date(),
          otpReason: OTPReason.PasswordReset,
        },
      });

      // TODO: Send OTP through email, remove the otp from the response object
      return {
        message: 'Sent an email',
        data: otp,
      };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async resetPassword(dto: PasswordResetDTO) {
    try {
      const { otp, password } = dto;
      const otpTimeToLive = new Date();
      otpTimeToLive.setMinutes(
        otpTimeToLive.getMinutes() - this.configService.get('OTP_TTL'),
      );
      const user = await this.dbService.user.findFirst({
        where: {
          otp,
          otpReason: OTPReason.PasswordReset,
          otpLastModifiedAt: { gte: otpTimeToLive },
        },
      });
      if (!user) {
        throw new ForbiddenException('Invalid otp');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await this.dbService.user.update({
        where: { email: user.email },
        data: {
          password: hashedPassword,
        },
      });

      return {
        message: 'Password reset successful',
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async getUserData(
    access_token: string,
    credentials: Record<string, any>,
  ) {
    try {
      const response = await fetch(
        `${this.configService.get('GOOGLE_API_BASE_URL')}/oauth2/v3/userinfo?access_token=${access_token}`,
      );
  
      if (!response.ok) throw new NotFoundException('User nor found!');

      const data = await response.json()
      return {
        googleId: data.sub,
        name: data.name,
        email: data.email,
        picture: data.picture, // Users who use google signin have verified email automatically,
        googleCredentials: credentials,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async signGoogleLink(redirectURLi: string) {
    try {
      const oAuth2Client = new OAuth2Client(
        this.configService.get('GOOGLE_CLIENT_ID'),
        this.configService.get('GOOGLE_CLIENT_SECRET'),
        redirectURLi,
      );

      const authorizedUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: `${this.configService.get('GOOGLE_API_BASE_URL')}/auth/userinfo.profile openid ${this.configService.get('GOOGLE_API_BASE_URL')}/auth/userinfo.email`,
        prompt: 'consent',
      });

      return {
        success: true,
        message: 'Authorized url',
        data: authorizedUrl,
      };
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async signInGoogle(redirectURLi: string, code: string) {
    try {
      const oAuth2Client = new OAuth2Client(
        this.configService.get('GOOGLE_CLIENT_ID'),
        this.configService.get('GOOGLE_CLIENT_SECRET'),
        redirectURLi,
      );
      const r = await oAuth2Client.getToken(code);
      // Make sure to set the credentials on the OAuth2 client.
      oAuth2Client.setCredentials(r.tokens);
      const user = oAuth2Client.credentials;
      const cred = await this.getUserData(
        oAuth2Client.credentials.access_token!,
        user,
      );

      if (!cred) throw new InternalServerErrorException();

      const oldUser = await this.dbService.user.findUnique({
        where: { googleId: cred.googleId },
      });
      if (!oldUser) throw new ForbiddenException('Account does not exist');

      const token = this.jwtService.sign(
        { uid: oldUser.id },
        {
          expiresIn: '1h',
        },
      );
      return { success: true, message: 'Signin successful', data: token };
    } catch (err) {
      throw new InternalServerErrorException('User signin failed');
    }
  }

  async signUpGoogle(
    dto: Record<string, any>,
    redirectURLi: string,
    code: string,
  ) {
    try {
      const oAuth2Client = new OAuth2Client(
        this.configService.get('GOOGLE_CLIENT_ID'),
        this.configService.get('GOOGLE_CLIENT_SECRET'),
        redirectURLi,
      );
      const r = await oAuth2Client.getToken(code);
      // Make sure to set the credentials on the OAuth2 client.
      oAuth2Client.setCredentials(r.tokens);
      const user = oAuth2Client.credentials;

      const cred = await this.getUserData(
        oAuth2Client.credentials.access_token!,
        user,
      );

      if (!cred) throw new InternalServerErrorException();

      // no duplicate user check
      const oldUser = await this.dbService.user.findUnique({
        where: { googleId: cred.googleId },
      });
      if (oldUser) throw new ForbiddenException('User already exist');

      const newUser = await this.dbService.user.create({
        data: {
          email: cred.email,
          fullName: cred.name,
          password: '',
          googleId: cred.googleId,
          profilePicture: cred.picture,
          emailVerified: true,
        },
      });

      // Setup default domain
      await this.dbService.domain.create({
        data: {
          name: dto.domainName,
          ownerId: newUser.id,

          domainMembers: {
            create: {
              memberRole: Roles.owner,
              userId: newUser.id
            }
          }
        },
      })

      const token = this.jwtService.sign(
        { uid: newUser.id },
        {
          expiresIn: '1h',
        },
      );

      return { success: true, message: 'Signup successful', data: token };
    } catch (err) {
      throw new InternalServerErrorException('User signup failed');
    }
  }
}