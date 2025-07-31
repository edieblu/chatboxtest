import { useState } from 'react';
import { type Message, messageSchema, chatRequestSchema } from '@/app/lib/validations';

export function useChat(initialMessages: Message[] = [], onSloveniaMatch?: () => void) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    if (content.toLowerCase().includes('slovenia')) {
      onSloveniaMatch?.();
    }

    const userMessage: Message = messageSchema.parse({
      role: 'user',
      content: content
    });
    setMessages(prev => [...prev, userMessage]);

    try {
      const requestPayload = chatRequestSchema.parse({
        message: content,
        chatHistory: [...messages, userMessage]
      });

      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No response received');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      // interesting, I've only used while (true) before, but I guess this saves you checking the condition at all 🤔
      for (; ;) {
        const { value, done } = await reader.read();
        if (done) break;

        aiContent += decoder.decode(value);

        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1].content = aiContent;
          }
          return updated;
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
}
