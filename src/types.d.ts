export interface AuthRequest extends Request {
  auth?: { uid: string }; // Adjust with the properties you need from User
}

declare module 'express' {
  interface Request {
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      fullName: string;
    };
  }
}
