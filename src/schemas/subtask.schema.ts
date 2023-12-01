import { z } from "zod"

export const subtaskCreateSchema = z.object({
  name: z.string().min(3),
  boardId: z.string().min(3)
});

export const substastEditSchema = z.object({
  name: z.string().min(3),
});

export type SubtaskCreateDTO = ReturnType<typeof subtaskCreateSchema.parse>;
export type SubtaskEditDTO = ReturnType<typeof substastEditSchema.parse>;

export default {
  subtaskCreateSchema,
  substastEditSchema
}