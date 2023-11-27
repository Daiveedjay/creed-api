import createHttpError from "http-errors";
import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import { ZodError } from "zod";
import { ObjType } from "@/types/util.types";
import crypto from "crypto";
import authSchema, {
  PasswordResetDTO,
  UserSigninDTOType,
  UserSignupDTOType,
} from "@/schemas/auth.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CONSTANTS from "@/utils/constants";
import { OAuth2Client } from "google-auth-library";
import { Controller } from "tsoa";
import BaseController from "@/utils/customBaseController";
import { StatusCodes } from "express-http-status";
import { OTPReason } from "@prisma/client";

@singleton()
export default class AuthService {
  constructor(private db: DbService) {}

  async signUp(controller: BaseController, dto: UserSignupDTOType) {
    try {
      const { email, password, domainName, fullName } =
        authSchema.userSignupSchema.parse(dto);

      const oldUser = await this.db.user.findUnique({ where: { email } });

      if (oldUser) {
        return controller.createError(
          StatusCodes.BAD_REQUEST,
          "Existing user",
          { email: "A user with this email already exists" }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.db.user.create({
        data: {
          email,
          password: hashedPassword,
          domainName,
          fullName,
        },
      });

      // TODO: Send welcome email

      const token = jwt.sign({ uid: user.id }, CONSTANTS.JWT_SECRET, {
        expiresIn: "1h",
      });
      return controller.sendResponse("Signup successful", token);
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error handling with http-errors
        const errors = error.errors.reduce((acc: any, cur) => {
          acc[cur.path.shift() as string] = cur.message;
          return acc;
        }, {});
        return controller.createError(
          StatusCodes.BAD_REQUEST,
          "Validation error",
          errors
        );
      } else {
        // Handle other unexpected errors
        return controller.createError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
      }
    }
  }

  async signIn(controller: BaseController, dto: UserSigninDTOType) {
    try {
      const { email, password } = authSchema.userSigninSchema.parse(dto);

      const user = await this.db.user.findUnique({ where: { email } });

      if (!user) {
        return controller.createError(
          StatusCodes.UNAUTHORIZED,
          "Invalid credentials"
        );
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return controller.createError(
          StatusCodes.UNAUTHORIZED,
          "Invalid credentials"
        );
      }

      // TODO: Send signin email

      const token = jwt.sign({ uid: user.id }, CONSTANTS.JWT_SECRET, {
        expiresIn: "1h",
      });
      return controller.sendResponse("Access Token", token);
    } catch (error) {
      return controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error logging in"
      );
    }
  }

  async forgotPassword(
    controller: BaseController,
    email: string
  ): Promise<any> {
    try {
      const user = await this.db.user.findUnique({ where: { email } });

      if (!user) {
        return controller.createError(
          500,
          "User with this email doesn't exist"
        );
      }
      // generate new OTP
      const otp = crypto.randomUUID().slice(0, CONSTANTS.OTP_LENGTH);
      await this.db.user.update({
        where: { email },
        data: {
          otp,
          otpLastModifiedAt: new Date(),
          otpReason: OTPReason.PasswordReset,
        },
      });

      // TODO: Send OTP through email, remove the otp from the response object
      return controller.sendResponse("Sent an email", { otp });
    } catch (err) {
      return controller.createError(500, "Sorry an error occured");
    }
  }

  async resetPassword(controller: BaseController, dto: PasswordResetDTO) {
    try {
      const { otp, password } = authSchema.passwordResetSchema.parse(dto);
      const otpTimeToLive = new Date();
      otpTimeToLive.setMinutes(otpTimeToLive.getMinutes() - CONSTANTS.OTP_TTL);
      const user = await this.db.user.findFirst({
        where: {
          otp,
          otpReason: OTPReason.PasswordReset,
          otpLastModifiedAt: { gte: otpTimeToLive },
        },
      });
      if (!user) {
        return controller.createError(StatusCodes.BAD_REQUEST, "Invalid otp");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await this.db.user.update({
        where: { email: user.email },
        data: {
          password: hashedPassword,
        },
      });

      return controller.sendResponse("Password reset successful");
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error handling with http-errors
        const errors = error.errors.reduce((acc: any, cur) => {
          acc[cur.path.shift() as string] = cur.message;
          return acc;
        }, {});
        return controller.createError(
          StatusCodes.BAD_REQUEST,
          "Validation error",
          errors
        );
      } else {
        // Handle other unexpected errors
        return controller.createError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
      }
    }
  }

  private async getUserData(access_token: string, credentials: ObjType) {
    const response = await fetch(
      `${CONSTANTS.GOOGLE_API_BASE_URL}/oauth2/v3/userinfo?access_token=${access_token}`
    );

    if (!response.ok) null;
    const data = await response.json();
    return {
      googleId: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture, // Users who use google signin have verified email automatically,
      googleCredentials: credentials,
    };
  }

  async signGoogleLink(redirectURL: string) {
    try {
      const oAuth2Client = new OAuth2Client(
        CONSTANTS.GOOGLE_CLIENT_ID,
        CONSTANTS.GOOGLE_CLIENT_SECRET,
        redirectURL
      );

      const authorizedUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: `${CONSTANTS.GOOGLE_API_BASE_URL}/auth/userinfo.profile openid ${CONSTANTS.GOOGLE_API_BASE_URL}/auth/userinfo.email`,
        prompt: "consent",
      });

      return {
        success: true,
        message: "Authorized url",
        data: authorizedUrl,
      };
    } catch (err) {
      return createHttpError(500, "Sorry an error occured");
    }
  }

  async signUpGoogle(
    controller: Controller,
    dto: ObjType,
    redirectURL: string,
    code: string
  ) {
    try {
      const oAuth2Client = new OAuth2Client(
        CONSTANTS.GOOGLE_CLIENT_ID,
        CONSTANTS.GOOGLE_CLIENT_SECRET,
        redirectURL
      );
      const r = await oAuth2Client.getToken(code);
      // Make sure to set the credentials on the OAuth2 client.
      oAuth2Client.setCredentials(r.tokens);
      const user = oAuth2Client.credentials;
      const cred = await this.getUserData(
        oAuth2Client.credentials.access_token!,
        user
      );

      if (!cred) return createHttpError(500, "Internal Server Error");

      // no duplicate user check
      const oldUser = await this.db.user.findUnique({
        where: { googleId: cred.googleId },
      });
      if (oldUser) return createHttpError(400, "User already exist");

      const newUser = await this.db.user.create({
        data: {
          domainName: dto.domainName,
          email: cred.email,
          fullName: cred.name,
          password: "",
          googleId: cred.googleId,
          profilePicture: cred.picture,
          emailVerified: true,
        },
      });

      const token = jwt.sign({ uid: newUser.id }, CONSTANTS.JWT_SECRET, {
        expiresIn: "1h",
      });

      return { success: true, message: "Signup successful", data: token };
    } catch (err) {
      controller.setStatus(500);
      return { message: "User signup failed", success: false, errors: null };
    }
  }

  async signInGoogle(redirectURL: string, code: string) {
    try {
      const oAuth2Client = new OAuth2Client(
        CONSTANTS.GOOGLE_CLIENT_ID,
        CONSTANTS.GOOGLE_CLIENT_SECRET,
        redirectURL
      );
      const r = await oAuth2Client.getToken(code);
      // Make sure to set the credentials on the OAuth2 client.
      oAuth2Client.setCredentials(r.tokens);
      const user = oAuth2Client.credentials;
      const cred = await this.getUserData(
        oAuth2Client.credentials.access_token!,
        user
      );

      if (!cred) return createHttpError(500, "Internal Server Error");
      const oldUser = await this.db.user.findUnique({
        where: { googleId: cred.googleId },
      });
      if (!oldUser) return createHttpError(400, "Account does not exist");

      const token = jwt.sign({ uid: oldUser.id }, CONSTANTS.JWT_SECRET, {
        expiresIn: "1h",
      });
      return { success: true, message: "Signin successful", data: token };
    } catch (err) {
      return createHttpError(500, "User signin failed");
    }
  }
}
