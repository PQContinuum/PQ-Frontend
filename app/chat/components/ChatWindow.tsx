'use client';

import { useEffect, useRef } from 'react';

import { useChatStore } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isStreaming } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const currentCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (currentCount < previousCount) {
      const scrollContainer = containerRef.current?.parentElement?.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    } else {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    previousMessageCountRef.current = currentCount;
  }, [messages, isStreaming]);

  return (
    <div ref={containerRef} className="space-y-4">
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
