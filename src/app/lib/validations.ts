import { z } from 'zod';

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

export const chatRequestSchema = z.object({
  message: z.string()
    .trim(),
  chatHistory: z.array(messageSchema)
    .default([]),
});

export const chatResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const onboardingAnswerSchema = z.object({
  country: z.string(),
  continent: z.string(),
  destinationType: z.string(),
});

export type Message = z.infer<typeof messageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type OnboardingAnswer = z.infer<typeof onboardingAnswerSchema>;
