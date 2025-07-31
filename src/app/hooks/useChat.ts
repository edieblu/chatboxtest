import { useState } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: Message = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content.trim(), 
          chatHistory: [...messages, userMessage].map(m => m.content)
        }),
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

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      // Stream the response
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        aiContent += decoder.decode(value);
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiContent;
          return updated;
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      
      // Remove empty assistant message on error
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