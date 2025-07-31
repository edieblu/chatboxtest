import OpenAI from 'openai';
import { ZodError } from 'zod';
import { chatRequestSchema } from '@/app/lib/validations';

export const runtime = 'edge'

// OPENAI_API_KEY should be set in your environment variables and is assumed here
const client = new OpenAI();

const SYSTEM_PROMPT = `You are a friendly travel assistant chatbot specializing in world geography. Your role is to:

1. **ONBOARDING PHASE**: Ask these questions ONE AT A TIME in order:
- Question 1: "What is your favorite country to visit or would like to visit? 🌍"
- Question 2: "What is your favorite continent and why? 🗺️"
- Question 3: "What type of destination appeals to you most? (beaches 🏖️, mountains 🏔️, cities 🏙️, historical sites 🏛️, etc.)"

2. **POST-ONBOARDING**: After collecting all three preferences, provide:
- Answer geography questions using their preferences as examples
- Give personalized travel recommendations
- Share interesting facts about places they mentioned
- Help them discover similar destinations they might enjoy

**RULES**: Keep the conversation light, engaging, and focused on travel topics. Use their preferences to guide responses.
- Only ask ONE question at a time during onboarding
- Wait for their answer before moving to the next question
- Remember their preferences and reference them in responses
- If they say "change preferences" or similar, restart onboarding
- Stay focused on geography and travel topics
- Be conversational and helpful
- IMPORTANT: Use plain text only, no markdown formatting (no **, ##, ---, etc.)
- Use relevant emojis throughout your responses to make them more engaging and memorable (🌍 🗺️ ✈️ 🏖️ 🏔️ 🏙️ 🏛️ 🎒 📍 etc.)`

export async function POST(req: Request) {
  const encoder = new TextEncoder()

  try {
    const body = await req.json()
    const validatedInput = chatRequestSchema.parse(body)
    const { message, chatHistory } = validatedInput

    console.log(message, 'Chat history length:', chatHistory.length)

    let contextualPrompt = SYSTEM_PROMPT
    if (chatHistory.length > 0) {
      const conversationContext = chatHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      contextualPrompt += `\n\nPrevious conversation:\n${conversationContext}\n\nBased on the conversation above, continue appropriately.`
    }

    const stream = await client.responses.create({
      model: "gpt-4.1",
      instructions: contextualPrompt,
      input: message,
      stream: true,
      // one word is around 1.33 tokens, so 150 words is about 200 tokens
      max_output_tokens: 200,
      // value between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
      temperature: 0.7,
    });

    // from openai docs:
    // Common events to listen for when streaming text are:
    //- `response.created`
    //- `response.output_text.delta`
    //- `response.completed`
    //- `error`
    const readableStream = new ReadableStream({
      async start(controller) {
        console.log(`Received message: ${message}`)
        try {
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta' && event.delta) {
              controller.enqueue(encoder.encode(event.delta))
            }
          }
        } catch (error) {
          console.error('OpenAI streaming error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })

  } catch (error) {
    console.error('API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    if (error instanceof ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid input provided',
        type: 'validation_error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (error instanceof Error && error.message.includes('OpenAI')) {
      return new Response(JSON.stringify({
        error: 'AI service temporarily unavailable',
        type: 'service_error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('429'))) {
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again in a moment.',
        type: 'rate_limit_error'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      error: 'Something went wrong. Please try again.',
      type: 'internal_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
