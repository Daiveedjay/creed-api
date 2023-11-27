// import db from "@/utils/db";
import createHttpError from "http-errors";
import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import { ZodError } from "zod";
import userSchema, { UserUpdateDTOType } from "@/schemas/user.schema";

@singleton()
export default class UserService {
  constructor(private db: DbService) {}

  async getProfile(uid: string) {
    try {
      const profile = await this.db.user.findUnique({
        where: { id: uid },
        select: {
          domainName: true,
          createdAt: true,
          email: true,
          fullName: true,
          updatedAt: true,
          id: true,
          jobTitle: true,
          department: true,
          location: true,
          language: true,
          availableHoursFrom: true,
          availableHoursTo: true,
          username: true,
        },
      });
      if (!profile) return createHttpError(400, "Invalid access token");
      return { success: true, message: "Profile", data: profile };
    } catch (err) {
      return createHttpError(500, "Server error");
    }
  }

  async editProfile(uid: string, body: UserUpdateDTOType) {
    try {
      const {
        domainName,
        // email,
        fullName,
        username,
        jobTitle,
        department,
        location,
        language,
        availableHoursFrom,
        availableHoursTo,
      } = userSchema.userUpdateSchema.parse(body);
      const profile = await this.db.user.update({
        where: { id: uid },
        data: {
          ...(domainName && { domainName }),
          // ...(email && { email }),
          ...(fullName && { fullName }),
          ...(username && { username }),
          ...(jobTitle && { jobTitle }),
          ...(department && { department }),
          ...(location && { location }),
          ...(language && { language }),
          ...(availableHoursFrom && { availableHoursFrom }),
          ...(availableHoursTo && { availableHoursTo }),
        },
        select: {
          domainName: true,
          createdAt: true,
          email: true,
          fullName: true,
          updatedAt: true,
          id: true,
          jobTitle: true,
          department: true,
          location: true,
          language: true,
          availableHoursFrom: true,
          availableHoursTo: true,
          username: true,
        },
      });
      return {
        success: true,
        message: "Profile updated",
        data: profile,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error handling with http-errors
        const errors = error.errors.reduce((acc: any, cur) => {
          acc[cur.path.shift() as string] = cur.message;
          return acc;
        }, {});
        return createHttpError(400, "Validation error", { errors });
      } else {
        // Handle other unexpected errors
        return createHttpError(500, "Internal server error");
      }
    }
  }
}
