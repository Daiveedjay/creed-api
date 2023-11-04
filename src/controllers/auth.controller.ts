import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "@/utils/db";
import authSchema from "@/schemas/auth.schema";
import createError from "http-errors";
import { ZodError } from "zod";
import CONSTANTS from "@/utils/constants";
import { OAuth2Client } from "google-auth-library";
import { ObjType } from "@/types/util.types";
import createHttpError from "http-errors";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, domainName, fullName } =
      authSchema.userSignupSchema.parse(req.body);

    const oldUser = await db.user.findUnique({ where: { email } });

    if (oldUser)
      return next(
        createError(400, "Existing user", {
          errors: { email: "A user with this email already exists" },
        })
      );

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
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
    res
      .status(201)
      .json({ success: true, message: "Signup successful", data: token });
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

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return next(createError(401, "Invalid credentials"));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return next(createError(401, "Invalid credentails"));
    }

    // TODO: Send signin email

    const token = jwt.sign({ uid: user.id }, CONSTANTS.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ success: true, message: "Access Token", data: token });
  } catch (error) {
    return next(createError(500, "Error logging in"));
  }
};

export const signGoogleLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");

  const redirectURL =
    (req.query.redirectURL as string) ||
    "http://localhost:5000/api/auth/signup-google";

  const oAuth2Client = new OAuth2Client(
    CONSTANTS.GOOGLE_CLIENT_ID,
    CONSTANTS.GOOGLE_CLIENT_SECRET,
    redirectURL
  );

  const authorizedUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope:
      "https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/userinfo.email",
    prompt: "consent",
  });

  return res.json({
    success: true,
    message: "Authorized url",
    data: authorizedUrl,
  });
};

async function getUserData(access_token: string, credentials: ObjType) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
  );

  if (!response.ok) null;
  const data = await response.json();
  // console.log(JSON.stringify(data, null, 2));
  return {
    googleId: data.sub,
    name: data.name,
    email: data.email,
    picture: data.picture, // Users who use google signin have verified email automatically,
    googleCredentials: credentials,
  };
}
export const signUpGoogle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code = req.query.code as string;
  try {
    const redirectURL =
      (req.query.redirectURL as string) ||
      "http://localhost:5000/api/auth/signup-google";

    const oAuth2Client = new OAuth2Client(
      CONSTANTS.GOOGLE_CLIENT_ID,
      CONSTANTS.GOOGLE_CLIENT_SECRET,
      redirectURL
    );
    const r = await oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    const user = oAuth2Client.credentials;
    const cred = await getUserData(
      oAuth2Client.credentials.access_token!,
      user
    );

    if (!cred) return next(createHttpError(500, "Internal Server Error"));

    // no duplicate user check
    const oldUser = await db.user.findUnique({
      where: { googleId: cred.googleId },
    });
    if (oldUser) return next(createHttpError(400, "User already exist"));

    const newUser = await db.user.create({
      data: {
        domainName: req.body.domainName,
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
    res
      .status(201)
      .json({ success: true, message: "Signup successful", data: token });
  } catch (err) {
    console.log("Error logging in with user", err);
    return res
      .status(500)
      .json({ success: false, message: "User signup failed" });
  }
};

export const signInGoogle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code = req.query.code as string;
  try {
    const redirectURL =
      (req.query.redirectURL as string) ||
      "http://localhost:5000/api/auth/signin-google";

    const oAuth2Client = new OAuth2Client(
      CONSTANTS.GOOGLE_CLIENT_ID,
      CONSTANTS.GOOGLE_CLIENT_SECRET,
      redirectURL
    );
    const r = await oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    const user = oAuth2Client.credentials;
    const cred = await getUserData(
      oAuth2Client.credentials.access_token!,
      user
    );

    if (!cred) return next(createHttpError(500, "Internal Server Error"));
    const oldUser = await db.user.findUnique({
      where: { googleId: cred.googleId },
    });
    if (!oldUser) return next(createHttpError(400, "Account does not exist"));

    const token = jwt.sign({ uid: oldUser.id }, CONSTANTS.JWT_SECRET, {
      expiresIn: "1h",
    });
    res
      .status(201)
      .json({ success: true, message: "Signin successful", data: token });
  } catch (err) {
    console.log("Error logging in with user", err);
    return res
      .status(500)
      .json({ success: false, message: "User signin failed" });
  }
};

export default {
  signUp,
  signIn,
  signGoogleLink,
  signUpGoogle,
  signInGoogle,
};
