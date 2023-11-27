// import db from "@/utils/db";
import createHttpError from "http-errors";
import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import { ZodError } from "zod";
import { ObjType } from "@/types/util.types";
import authSchema, {
  UserSigninDTOType,
  UserSignupDTOType,
} from "@/schemas/auth.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CONSTANTS from "@/utils/constants";
import { OAuth2Client } from "google-auth-library";
import { Controller } from "tsoa";

@singleton()
export default class AuthService {
  constructor(private db: DbService) {}

  async signUp(controller: Controller, dto: UserSignupDTOType) {
    try {
      const { email, password, domainName, fullName } =
        authSchema.userSignupSchema.parse(dto);

      const oldUser = await this.db.user.findUnique({ where: { email } });

      if (oldUser) {
        controller.setStatus(400);
        return {
          success: false,
          message: "Existing user",
          errors: { email: "A user with this email already exists" },
        };
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
      return { success: true, message: "Signup successful", data: token };
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error handling with http-errors
        const errors = error.errors.reduce((acc: any, cur) => {
          acc[cur.path.shift() as string] = cur.message;
          return acc;
        }, {});
        controller.setStatus(400);
        return { success: false, message: "Validation error", errors };
      } else {
        // Handle other unexpected errors
        controller.setStatus(500);
        return {
          success: false,
          message: "Internal server error",
          errors: null,
        };
      }
    }
  }

  async signIn(controller: Controller, dto: UserSigninDTOType) {
    try {
      const { email, password } = authSchema.userSigninSchema.parse(dto);

      const user = await this.db.user.findUnique({ where: { email } });

      if (!user) {
        controller.setStatus(401);
        return { success: false, message: "Invalid credentials", errors: null };
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        controller.setStatus(401);
        return { success: false, message: "Invalid credentails", errors: null };
      }

      // TODO: Send signin email

      const token = jwt.sign({ uid: user.id }, CONSTANTS.JWT_SECRET, {
        expiresIn: "1h",
      });
      return { success: true, message: "Access Token", data: token };
    } catch (error) {
      controller.setStatus(500);
      return { success: false, message: "Error logging in", errors: null };
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
      console.log(err);
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
      console.log(err);

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
