import { z } from "zod";

export const domainUpdateSchema = z.object({
  domainName: z.string().min(3).trim().optional(),
});

export const domainCreateSchema = z.object({
  domainName: z.string().min(3).trim(),
});

export type DomainCreateDTO = ReturnType<typeof domainCreateSchema.parse>;
export type DomainUpdateDTO = ReturnType<typeof domainUpdateSchema.parse>;

export default {
  domainCreateSchema,
  domainUpdateSchema,
};
