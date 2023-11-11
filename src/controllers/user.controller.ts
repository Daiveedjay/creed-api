import userSchema from "@/schemas/user.schema";
import { AuthRequest } from "@/types/auth.types";
import { ObjType } from "@/types/util.types";
import db from "@/utils/db";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { ZodError } from "zod";

export const getProfile = async (
  req: AuthRequest | ObjType,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await db.user.findUnique({
      where: { id: req.auth.uid },
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
        username: true
      },
    });
    if(!profile) return next(createHttpError(400, "Invalid access token"));
    return res.json({ success: true, message: "Profile", data: profile });
  } catch (err) {
    return next(createHttpError(500, "Server error"));
  }
};

export const editProfile = async (
  req: AuthRequest | ObjType,
  res: Response,
  next: NextFunction
) => {
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
    } = userSchema.userUpdateSchema.parse(req.body);
    const profile = await db.user.update({
      where: { id: req.auth.uid },
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
        username: true
      },
    });
    return res.json({
      success: true,
      message: "Profile updated",
      data: profile,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod validation error handling with http-errors
      const errors = error.errors.reduce((acc: any, cur) => {
        acc[cur.path.shift() as string] = cur.message;
        return acc;
      }, {});
      next(createHttpError(400, "Validation error", { errors }));
    } else {
      // Handle other unexpected errors
      next(createHttpError(500, "Internal server error"));
    }
  }
};

export default {
  getProfile,
  editProfile,
};
