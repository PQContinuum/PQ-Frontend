import { z } from "zod";

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content is required"),
  createdAt: z.date().default(() => new Date()),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
