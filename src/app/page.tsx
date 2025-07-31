"use client";
import { useState, useRef, useEffect } from "react";
import { useChat, type Message } from "@/app/hooks/useChat";

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Welcome to your personal travel assistant! I'd love to learn about your travel preferences. What is your favorite country to visit or would like to visit?",
};

export default function Home() {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage } = useChat([
    INITIAL_MESSAGE,
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [messages]);

  async function send() {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput("");

    await sendMessage(userInput);
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Travel Assistant
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Say "change preferences" to restart onboarding
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600 mr-1"></div>
              Thinking...
            </div>
          )}
        </div>
        {error && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] break-words ${
              msg.role === "user"
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50"
            } rounded-md px-3 py-1`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-md border px-2 py-1 text-sm bg-transparent outline-none"
          placeholder="Type a message"
          disabled={isLoading}
        />
        <button
          onClick={send}
          disabled={isLoading || !input.trim()}
          className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
