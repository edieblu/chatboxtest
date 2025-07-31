import OpenAI from 'openai';

export const runtime = 'edge'

const client = new OpenAI();

const SYSTEM_PROMPT = `You are a friendly travel assistant chatbot specializing in world geography. Your role is to:

1. **ONBOARDING PHASE**: Ask these questions ONE AT A TIME in order:
- Question 1: "What is your favorite country to visit or would like to visit?"
- Question 2: "What is your favorite continent and why?"
- Question 3: "What type of destination appeals to you most? (beaches, mountains, cities, historical sites, etc.)"

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
- Be conversational and helpful`

export async function POST(req: Request) {
  const { message } = await req.json()
  const encoder = new TextEncoder()
  console.log(message)
  const stream = await client.responses.create({
    model: "gpt-4.1",
    instructions: SYSTEM_PROMPT,
    input: message,
    stream: true,
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      console.log(`Received message: ${message}`)
      try {
        for await (const chunk of stream) {
          console.log(chunk);
          if (chunk.type === 'response.output_text.delta' && chunk.delta) {
            controller.enqueue(encoder.encode(chunk.delta))
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
}
