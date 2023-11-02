import { z } from "zod";

export const userUpdateSchema = z.object({
  // email: z.string().email().optional(),
  fullName: z.string().min(3).optional(),
  domainName: z.string().min(3).optional(),
  username: z.string().min(3).optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  language: z.string().optional(),
  availableHoursFrom: z.string().optional(),
  availableHoursTo: z.string().optional(),
});

export default {
  userUpdateSchema,
};
