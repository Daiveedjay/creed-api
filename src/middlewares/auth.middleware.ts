import CONSTANTS from "@/utils/constants";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "@/types/auth.types";
import createHttpError from "http-errors";
import { ObjType } from "@/types/util.types";

const authenticate = (req: AuthRequest | ObjType, res: Response, next: NextFunction) => {
  const authorization = req.headers["authorization"];
  
  if (!authorization) {
    return res.status(401).json({ message: "No authorization header" });
  }

  const token = authorization.split(" ").pop();

  if (!token) {
    return next(createHttpError(401, "No token provided"));
  }
  try {
    const payload: any = jwt.verify(token, CONSTANTS.JWT_SECRET);

    if (!payload) {
      return next(createHttpError(401, "No payload"));
    }

    req.auth = payload;

    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(createHttpError(401, "Token expired"));
    }
    return next(createHttpError(401, "Token invalid"));
  }
};

export default authenticate;
