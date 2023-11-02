import { z } from "zod";

export const userSignupSchema = z.object({
  fullName: z.string().min(3),
  domainName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6, "Password should be at least 6 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    'Weak password'
  ), // Password must contain at least one capital letter, one small letter, one number, and one special character
});

export const userSigninSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default {
  userSignupSchema, 
  userSigninSchema,
}