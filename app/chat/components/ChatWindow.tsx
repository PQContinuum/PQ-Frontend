'use client';

import { useLayoutEffect, useRef, memo } from 'react';

import { useMessages, useIsStreaming, useConversationId } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export const ChatWindow = memo(function ChatWindow() {
  const messages = useMessages();
  const isStreaming = useIsStreaming();
  const conversationId = useConversationId();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(messages.length);
  const previousConversationId = useRef(conversationId);

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
      {messages.map((message, index) => (
        <div key={message.id}>
          <MessageBubble
            message={message}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
          />
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
});
