/* eslint-disable prettier/prettier */
import { type Request } from "express";
import { Role } from "./collaborators/collaborator.dto";
import { Socket } from 'socket.io';
import { $Enums } from "@prisma/client";
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

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string,
    createdAt: Date,
    updatedAt: Date,
    email: string,
    fullName: string,
  };
}


type InviterPayload = {
  id: string;
  name: string
}

export type InvitePayload = {
  otp: string;
  domainName: string;
  domainId: string;
  role: Role.Member | Role.Admin;
  createdAt: Date;
  expiredAt: Date;
  invitedBy: InviterPayload
}

export type UserPayload = {
  id: string;
  createdAt: Date;
  memberRole: $Enums.Roles;
  user: {
      id: string;
      email: string;
      fullName: string;
      username: string;
      jobTitle: string;
      department: string;
      location: string;
      profilePicture: string;
  };
}