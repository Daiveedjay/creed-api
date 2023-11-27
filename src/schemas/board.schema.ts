import { z } from "zod";

export const boardCreateSchema = z.object({
  name: z.string().min(3).trim(),
  domainId: z.string().min(3).trim(),
  // Add other properties as needed for creating a board
});

export const boardUpdateSchema = z.object({
  name: z.string().min(3).trim().optional(),
  // Add other optional properties as needed for updating a board
});

export type BoardCreateDTO = ReturnType<typeof boardCreateSchema.parse>;

export type BoardUpdateDTO = ReturnType<typeof boardUpdateSchema.parse>;

export default {
  boardCreateSchema,
  boardUpdateSchema,
};
