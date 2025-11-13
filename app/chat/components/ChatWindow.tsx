'use client';

import { useLayoutEffect, useRef } from 'react';

import { useChatStore } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isStreaming, conversationId } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(messages.length);
  const previousConversationId = useRef(conversationId);

  // useLayoutEffect para scroll (evita flicker visual)
  useLayoutEffect(() => {
    const scrollContainer = containerRef.current?.parentElement?.parentElement;
    if (!scrollContainer) return;

    const isConversationSwitch = previousConversationId.current !== conversationId;
    const shouldScrollToTop =
      isConversationSwitch ||
      messages.length < previousMessageCount.current;

    if (shouldScrollToTop) {
      scrollContainer.scrollTop = 0;
    } else if (messages.length > previousMessageCount.current) {
      // Solo scroll down si hay mensajes nuevos
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    previousMessageCount.current = messages.length;
    previousConversationId.current = conversationId;
  }, [messages.length, conversationId]);

  return (
    <div
      ref={containerRef}
      className="space-y-4"
    >
      {messages.map((message) => (
        <div key={message.id}>
          <MessageBubble message={message} />
        </div>
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
