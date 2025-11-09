'use client';

import { useEffect, useRef } from 'react';

import { useChatStore } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isStreaming } = useChatStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isStreaming && (
        <div className="px-2">
          <TypingIndicator />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
