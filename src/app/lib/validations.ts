import { z } from 'zod';

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

export const chatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long (max 1000 characters)')
    .trim(),
  chatHistory: z.array(z.string())
    .max(50, 'Chat history too long')
    .optional()
    .default([]),
});

export const chatResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const onboardingAnswerSchema = z.object({
  country: z.string().min(1).max(100).optional(),
  continent: z.string().min(1).max(50).optional(),
  destinationType: z.string().min(1).max(100).optional(),
});

export type Message = z.infer<typeof messageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type OnboardingAnswer = z.infer<typeof onboardingAnswerSchema>;
