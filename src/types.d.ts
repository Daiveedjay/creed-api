/* eslint-disable prettier/prettier */
import { type Request } from "express";
import { Role } from "./collaborators/collaborator.dto";
import { Socket } from 'socket.io';
import { $Enums, Task } from "@prisma/client";
import { Job } from "bull";

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

type NotificationData = {
  title: string;
  body: string;
}

type InviterPayload = {
  id: string;
  name: string;
  jobTitle: string;
}

export type InvitePayload = {
  otp: string;
  domainName: string;
  domainId: string;
  role: 'admin' | 'member'
  createdAt: Date;
  expiredAt: Date;
  invitedBy: InviterPayload
}

export type UserPayload = {
  id: string;
  createdAt: Date;
  memberRole: $Enums.Roles;
  domain: {
    id: string;
    name: string
  };
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

declare module 'express' {
  interface Request {
    user: any;
  }
}

export interface Collaborator {
  createdAt: Date,
  user: {
    id: string,
    fullName: string,
    profilePicture: string | null
  },
}

export interface QueueJob extends Job {
  email: string[] | string,
  subject: string,
  body: string
} 
