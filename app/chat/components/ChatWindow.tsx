'use client';

import { useEffect, useRef } from 'react';

import { useChatStore } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isStreaming } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isStreaming]);

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden rounded-[32px]">
      <div
        ref={containerRef}
        className="chat-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && (
          <div className="px-2">
            <TypingIndicator />
          </div>
        )}
      </div>

      <style jsx global>{`
        .chat-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.25);
          border-radius: 999px;
        }
        .chat-scrollbar {
          scrollbar-color: rgba(0, 0, 0, 0.35) transparent;
        }
      `}</style>
    </section>
  );
}
