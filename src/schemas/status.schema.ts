import { z } from "zod"

export const statusCreateSchema = z.object({
  name: z.string().min(3),
  boardId: z.string().min(3)
});

export const statusEditSchema = z.object({
  name: z.string().min(3),
});

export type StatusCreateDTO = ReturnType<typeof statusCreateSchema.parse>;
export type StatusEditDTO = ReturnType<typeof statusEditSchema.parse>;

export default {
  statusCreateSchema,
  statusEditSchema
}