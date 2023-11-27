import CONSTANTS from "@/utils/constants";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "@/types/auth.types";
import createHttpError from "http-errors";
import { ObjType } from "@/types/util.types";

const authenticateMiddleware = (
  req: AuthRequest | ObjType,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers["authorization"];

  if (!authorization) {
    return next(createHttpError(401, "No authorization header"));
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

export function expressAuthentication(
  req: AuthRequest | ObjType,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "bearerAuth") {
    const authorization = req.headers["authorization"];

    if (!authorization) {
      return Promise.reject(createHttpError(401, "No authorization header"));
    }

    const token = authorization.split(" ").pop();

    if (!token) {
      return Promise.reject(createHttpError(401, "No token provided"));
    }

    try {
      const payload: any = jwt.verify(token, CONSTANTS.JWT_SECRET);

      if (!payload) {
        return Promise.reject(createHttpError(401, "No payload"));
      }

      req.auth = payload;

      return Promise.resolve(payload);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return Promise.reject(createHttpError(401, "Token expired"));
      }
      return Promise.reject(createHttpError(401, "Token invalid"));
    }
  }

  return Promise.reject(createHttpError(401, "Invalid security scheme"));
}

export default authenticateMiddleware;
