import { z } from "zod";

export const userUpdateSchema = z.object({
  // email: z.string().email().optional(),
  fullName: z.string().min(3).trim().optional(),
  domainName: z.string().min(3).trim().optional(),
  username: z.string().min(3).trim().optional(),
  jobTitle: z.string().trim().optional(),
  department: z.string().trim().optional(),
  location: z.string().trim().optional(),
  language: z.string().trim().optional(),
  availableHoursFrom: z.string().trim().optional(),
  availableHoursTo: z.string().trim().optional(),
});

export default {
  userUpdateSchema,
};
