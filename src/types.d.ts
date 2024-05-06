/* eslint-disable prettier/prettier */
import { type Request } from "express";
export interface AuthRequest extends Request {
  auth?: { uid: string }; // Adjust with the properties you need from User
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    fullName: string;
  };
}
