import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "@/utils/db";
import authSchema from "@/schemas/auth.schema";
import createError from "http-errors";
import { ZodError } from "zod";
import CONSTANTS from "@/utils/constants";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, domainName, fullName } = authSchema.userSignupSchema.parse(req.body);

    const oldUser = await db.user.findUnique({ where: { email }});

    if(oldUser) return next(createError(400, "Existing user", { errors: { email: "A user with this email already exists" }}));

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        domainName,
        fullName
      },
    });
    
    // TODO: Send welcome email

    const token = jwt.sign({ uid: user.id }, CONSTANTS.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ success: true, message: "Signup successful", data: token });
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod validation error handling with http-errors
      const errors = error.errors.reduce((acc: any, cur) => {
        acc[cur.path.shift() as string] = cur.message;
        return acc;
      }, {});
      next(createError(400, "Validation error", { errors }));
    } else {
      // Handle other unexpected errors
      console.log(error);
      next(createError(500, "Internal server error"));
    }
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // TODO: Send signin email

    const token = jwt.sign({ uid: user.id }, CONSTANTS.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
};

export default {
  signUp,
  signIn,
};
