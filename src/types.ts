export interface AuthRequest extends Request {
  auth?: { uid: string }; // Adjust with the properties you need from User
}