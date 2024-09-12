/* eslint-disable prettier/prettier */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
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
import { UserPayload } from 'src/types';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { EmailService } from 'src/utils/email.service';
import { NotifyService } from 'src/utils/notify.service';
import { UserService } from 'src/user/user.service';
import { InjectRedis } from 'nestjs-redis-fork';
import { Redis } from "ioredis";
import { admin } from 'src/lib/firebase';


@Injectable()
export class AuthService {
  private oAuth2Client: OAuth2Client

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userService: UserService,
    private readonly dbService: DbService,
    private readonly notifyService: NotifyService,
    private readonly analyticService: AnalyticsService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.oAuth2Client = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  async signUp(dto: UserSignupDTOType) {
    // const firstName = dto.fullName.split(' ')
    const oldUser = await this.dbService.user.findUnique({
      where: { email: dto.email },

    });

    if (oldUser) {
      throw new ForbiddenException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // await this.emailService.sendWelcomeEmail(dto.email, firstName[0])

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
      },
      include: {
        panels: true,
        status: true,
        domainMembers: true,
      }
    });

    await this.dbService.domainMembership.create({
      data: {
        userId: user.id,
        domainId: newDomain.id,
        memberRole: 'owner',
      }
    })


    // await this.dbService.device.create({
    //   data: {
    //     userId: user.id,
    //     deviceToken: dto.deviceToken
    //   }
    // })

    const token = this.jwtService.sign(
      { uid: user.id },
      {
        expiresIn: '1d',
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

    const allDomains = await this.dbService.domain.findMany({
      where: {
        domainMembers: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        status: true,
        tasks: true,
        panels: true
      }
    })

    const members = await this.dbService.domainMembership.findMany({
      where: {
        domainId: allDomains[0].id
      },
      select: {
        createdAt: true,
        id: true,
        memberRole: true,
        domain: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            jobTitle: true,
            department: true,
            location: true,
            profilePicture: true,
          }
        }

      }
    })
    const analytics = await this.analyticService.getAnalyticsofDomain(allDomains[0].id, userObj.email)
    const averageTimeAnalyticsFor5Days = await this.analyticService.getAverageTiemToCompleteATask(allDomains[0].id, userObj.email, 'last5Days')
    const totalTimeAnalyticsFor5Days = await this.analyticService.getTotalTimeToCompleteATask(allDomains[0].id, userObj.email, 'last5Days')
    //await this.emailService.sendWelcomeEmail(userObj.email)
    await this.notifyService.storeDeviceToken(user.id, dto.deviceToken)

    return {
      message: 'Signup successful',
      access_token: token,
      user_data: userObj,
      domains: {
        domains: allDomains,
        members: members,
        panels: [],
        analytics: {
          analytics,
          totalTimeAnalyticsFor5Days: {
            Monday: 0,
            Tuesday: 0,
            Wednesday: 0,
            Thursday: 0,
            Friday: 0,
            Saturday: 0,
            Sunday: 0,

          },
          averageTimeAnalyticsFor5Days: {
            Monday: 0,
            Tuesday: 0,
            Wednesday: 0,
            Thursday: 0,
            Friday: 0,
            Saturday: 0,
            Sunday: 0,
          }
        }
      }
    }

  }

  async signIn(dto: UserSigninDTOType) {
    const user = await this.dbService.user.findUnique({
      where: { email: dto.email },
      include: {
        Device: {
          select: {
            deviceToken: true
          }
        }
      }
    });

    if (!user) {
      throw new ForbiddenException('No user like this!');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new ForbiddenException('Invalid credentials');
    }

    // TODO: Send signin email

    const token = this.jwtService.sign(
      { uid: user.id },
      {
        expiresIn: '1d',
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

    const domains = await this.dbService.domain.findMany({
      where: {
        domainMembers: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        tasks: true,
        panels: true,
        status: true,
      }
    });

    const panels = await this.dbService.panel.findMany({
      where: {
        panelMembers: {
          some: {
            domainId: domains[0].id,
            userId: user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const allPanels = await this.dbService.panel.findMany({
      where: {
        domainId: domains[0].id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const members = await this.dbService.domainMembership.findMany({
      where: {
        domainId: domains[0].id
      },
      select: {
        createdAt: true,
        id: true,
        memberRole: true,
        domain: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            jobTitle: true,
            department: true,
            location: true,
            profilePicture: true,
          }
        }

      }
    })
    //console.log(domains[0])

    const analytics = await this.analyticService.getAnalyticsofDomain(domains[0].id, userObj.email)
    //const deviceToken = await this.notifyService.getDeviceTokens([user.id])
    await this.notifyService.storeDeviceToken(user.id, dto.deviceToken)

    // if (deviceToken[0] === null) {
    //   await this.notifyService.storeDeviceToken(user.id, user.Device.deviceToken)
    // }



    if (domains[0].panels.length < 0 || domains[0].tasks.length < 0) {
      return {
        message: 'Signup successful',
        access_token: token,
        user_data: userObj,
        domains: {
          domains,
          members,
          panels: domains[0].ownerId === userObj.id ? allPanels : panels,
          analytics: {
            analytics,
            totalTimeAnalyticsFor5Days: {
              Monday: 0,
              Tuesday: 0,
              Wednesday: 0,
              Thursday: 0,
              Friday: 0,
              Saturday: 0,
              Sunday: 0,

            },
            averageTimeAnalyticsFor5Days: {
              Monday: 0,
              Tuesday: 0,
              Wednesday: 0,
              Thursday: 0,
              Friday: 0,
              Saturday: 0,
              Sunday: 0,
            }
          }
        }
      }
    } else {
      const [averageTimeAnalyticsFor5Days, totalTimeAnalyticsFor5Days] = await Promise.all([
        this.analyticService.getAverageTiemToCompleteATask(domains[0].id, userObj.email, 'last5Days'),
        this.analyticService.getTotalTimeToCompleteATask(domains[0].id, userObj.email, 'last5Days')
      ])

      return {
        message: 'Access Token',
        access_token: token,
        user_data: userObj,
        domains: {
          domains,
          members,
          panels: domains[0].ownerId === userObj.id ? allPanels : panels,
          analytics: {
            analytics,
            totalTimeAnalyticsFor5Days,
            averageTimeAnalyticsFor5Days
          }
        },
      };
    }

  }

  async forgotPassword(email: string) {
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

  }

  async resetPassword(dto: PasswordResetDTO) {
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

  }

  private async getUserData(
    access_token: string,
    credentials: Record<string, any>,
  ) {
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

  }

  async signGoogleLink(redirectURLi: string) {
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

  }

  async signInGoogle(redirectURLi: string, code: string) {
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
        expiresIn: '12h',
      },
    );
    return { success: true, message: 'Signin successful', data: token };

  }

  async signUpGoogle(
    dto: Record<string, any>,
    redirectURLi: string,
    code: string,
  ) {
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
        expiresIn: '12h',
      },
    );

    return { success: true, message: 'Signup successful', data: token };

  }

  async verifyAndUpdateUser(accessToken: string, deviceToken: string) {
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    const userInfo = await this.dbService.user.findUnique({
      where: {
        email: decodedToken.email,
      },
    });

    if (!userInfo) {
      throw new MethodNotAllowedException('No account like this!')
    }

    return await this.signIn({
      email: decodedToken.email,
      password: decodedToken.sub,
      deviceToken,
      rememberMe: true
    })
  }

  async verifyAndCreateUser(accessToken: string, deviceToken: string) {
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    const userInfo = await this.dbService.user.findUnique({
      where: {
        email: decodedToken.email,
      },
    });

    if (userInfo) {
      const currentUser = await this.signIn({
        email: decodedToken.email,
        password: decodedToken.sub,
        deviceToken,
        rememberMe: true
      })

      return currentUser;
    } else {
      const firstName = decodedToken.name.split(' ').split(' ')
      console.log(firstName)

      const newUser = await this.signUp({
        email: decodedToken.email,
        fullName: decodedToken.name,
        profilePicture: decodedToken.picture,
        password: decodedToken.sub,
        phone: '',
        deviceToken: deviceToken,
        domainName: `${firstName}'s Domain`,
        country: ''
      });

      await admin.auth().setCustomUserClaims(decodedToken.uid, {
        userId: newUser.user_data.id,
      });

      return newUser;
    }
  }
}
