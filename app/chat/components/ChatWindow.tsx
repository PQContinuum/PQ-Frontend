'use client';

import { useLayoutEffect, useRef, memo } from 'react';

import {
  useMessages,
  useIsStreaming,
  useConversationId,
  useGenerationMode,
  useIsGenerating,
  useGeneratingMessageId,
  useLinkFetch,
} from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { LinkFetchIndicator } from './LinkFetchIndicator';

export const ChatWindow = memo(function ChatWindow() {
  const messages = useMessages();
  const isStreaming = useIsStreaming();
  const conversationId = useConversationId();
  const generationMode = useGenerationMode();
  const isGenerating = useIsGenerating();
  const generatingMessageId = useGeneratingMessageId();
  const linkFetch = useLinkFetch();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(messages.length);
  const previousConversationId = useRef(conversationId);
  const lastMessage = messages[messages.length - 1];
  const isAssistantStreamingText =
    isStreaming &&
    generationMode === 'none' &&
    lastMessage?.role === 'assistant' &&
    lastMessage.content.trim().length > 0;

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
      className="space-y-4 overflow-x-hidden"
    >
      {messages.map((message, index) => (
        <div key={message.id}>
          <MessageBubble
            message={message}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
            attachments={message.attachments}
            isGenerating={isGenerating && message.id === generatingMessageId}
            generationMode={message.id === generatingMessageId ? generationMode : 'none'}
          />
        </div>
      ))}
      {/* Solo mostrar TypingIndicator si NO se está generando imagen o video */}
      {isStreaming && generationMode === 'none' && !isAssistantStreamingText && linkFetch?.status === 'fetching' && (
        <div className="px-2">
          <LinkFetchIndicator linkType={linkFetch.type} />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
});
