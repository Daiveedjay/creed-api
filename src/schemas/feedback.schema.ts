import { z } from "zod";

// Schemas
export const contactUsSchema = z.object({
  email: z.string().email().trim(),
  message: z.string().min(3).trim(),
});

// DTO types
export type ContactUsDTO = ReturnType<typeof contactUsSchema.parse>;

export default {
  contactUsSchema,
};
