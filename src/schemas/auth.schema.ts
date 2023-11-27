import CONSTANTS from "@/utils/constants";
import { z } from "zod";

export const userSignupSchema = z.object({
  fullName: z.string().min(3).trim(),
  domainName: z.string().min(3).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z
    .string()
    .min(6, "Password should be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Weak password"
    )
    .trim(), // Password must contain at least one capital letter, one small letter, one number, and one special character
});

export type UserSignupDTOType = {
  fullName?: string;
  domainName?: string;
  email?: string;
  password?: string;
};

export const userSigninSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().trim(),
});

export type UserSigninDTOType = {
  email: string;
  password: string;
};

export const passwordResetSchema = z.object({
  otp: z.string().min(CONSTANTS.OTP_LENGTH).trim(),
  password: z
    .string()
    .min(6, "Password should be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Weak password"
    )
    .trim(),
});

export type PasswordResetDTO = {
  otp: string,
  password: string
}

export default {
  userSignupSchema,
  userSigninSchema,
  passwordResetSchema
};
